import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const VALID_CATEGORIES = [
  "Salary",
  "Business",
  "Transfer",
  "Refund",
  "Food & Drinks",
  "Groceries",
  "Transport",
  "Education",
  "Housing",
  "Healthcare",
  "Shopping",
  "Entertainment",
  "Bills",
  "Travel",
  "Investment",
  "Other",
] as const;

const SYSTEM_PROMPT = `You are JustLog's AI transaction parser. The user may type ONE or MULTIPLE transactions (one per line, comma-separated, or natural sentences).

Always return ONLY a valid JSON array. No markdown, no backticks, nothing else.

Format:
[
  {
    "amount": <number, no symbols>,
    "type": "income" or "expense",
    "category": <one of: ${VALID_CATEGORIES.join(", ")}>,
    "description": <clean title case, e.g. "Morning Coffee", "School Fees", "Income from Client">
  }
]

Rules:
- AMOUNT: "5k" = 5000, "2k" = 2000, "40k" = 40000, "1.5k" = 1500, "2L" = 200000, "1L" = 100000. The suffix "k" or "K" after a number is a multiplier (×1000), NEVER part of a person's name. "lend to ashok 40k" → amount=40000, name=Ashok (the K belongs to the number, not the name).
- TYPE: salary/received/income/got/from [person] = "income"; everything else = "expense". Exception: "lent to X" or "gave loan to X" = "expense".
- PERSON vs EMPLOYER: If the text says "from [human name]" (e.g. "from Rohit", "from Amol", "from Dipesh", "from Priya") → category MUST be "Transfer". "Salary" is ONLY for employer payments using words like "salary", "stipend", "paycheck". A person's name after "from" is NEVER Salary — always Transfer.
- SALARY vs TRANSFER: "salary", "stipend", "paycheck" keywords = "Salary". "from [person name]" = "Transfer". NEVER mix these up.
- DESCRIPTION: Extract a SHORT clean English title (2-4 words max). NEVER copy the full sentence. The user may speak in Hindi/Hinglish — extract only the key subject. Examples: "Aaj maine chai piya 50 rupees" → "Chai", "Aaj Ocean Ka Fees Maine Bhara 2000" → "Ocean School Fees", "Aaj Maine Aasheen Ka 2000 rs school fees bhara" → "Aasheen School Fees", "spent 500 on groceries today morning" → "Groceries". Always fix spelling mistakes. Use Title Case. Do NOT include amount, currency, or filler words like "aaj", "maine", "ka", "ne", "ke liye".
- *** MOST IMPORTANT RULE ***: "from [human name]" patterns like "500 from Rohit", "from Amol", "from Dipesh", "4k from Priya" → category = "Transfer". This overrides EVERYTHING including income type detection. These are person-to-person money transfers, NOT salary.

- *** GROUP PAYMENT RULE (DOUBLE ENTRY) ***: When someone paid for a group expense on behalf of others, create TWO entries:
  Triggers: "[expense] by [name]", "[name] paid for [expense]", "[name] paid [expense]", "[name] ne [expense] bhara/diya", "[expense] paid by [name]"
  Entry 1: type="income", category="Transfer", description="From [Name]", amount=X  (they paid upfront)
  Entry 2: type="expense", category=<expense category>, description=<expense name>, amount=X  (the actual expense)
  This is DIFFERENT from "from [name]" alone (which is income only). The trigger is when BOTH a person AND an expense item are present together.

- CATEGORY PRIORITY (higher rules override lower ones):
  1. loan/borrowed/lent/gave loan/given to [person]/gave to [person]/paid to [person] OR "from [person name]" = "Transfer" (HIGHEST PRIORITY — overrides all other rules)
  2. chai/tea/coffee/food/lunch/dinner/breakfast/snack/restaurant/swiggy/zomato = "Food & Drinks"
  3. grocery/groceries/vegetables/fruits/milk/apple/banana/mango/pomegranate/tomato/onion/potato/rice/dal/bread/eggs = "Groceries"
  4. uber/ola/petrol/fuel/auto/bus/metro = "Transport"
  5. rent/electricity/wifi/internet/phone/recharge/bill = "Bills"
  6. medicine/doctor/hospital/pharmacy = "Healthcare"
  7. movie/netflix/game/spotify/cinema = "Entertainment"
  8. salary/freelance/client = "Salary"
  9. shopping/clothes/amazon/flipkart/stationery/pen/notebook/books = "Shopping"
  10. school/fees/tuition/college/course = "Education"
  11. house/home/flat/property (but NOT loan) = "Housing"
- "loan from X" = ONE income entry, category "Transfer", description "Loan from X". Never say "Income from X" when the word "loan" is present.
- Each line or item = separate object in the array
- Return ONLY the JSON array, nothing else

Examples:
"got 5k from client" → [{"amount": 5000, "type": "income", "category": "Salary", "description": "Income from Client"}]
"spent 500 on chai with friends" → [{"amount": 500, "type": "expense", "category": "Food & Drinks", "description": "Chai with Friends"}]
"paid mom 2000 for house rent" → [{"amount": 2000, "type": "expense", "category": "Housing", "description": "House Rent"}]
"400 cofee" → [{"amount": 400, "type": "expense", "category": "Food & Drinks", "description": "Coffee"}]
"4k from jaya" → [{"amount": 4000, "type": "income", "category": "Transfer", "description": "From Jaya"}]
"500 from rohit" → [{"amount": 500, "type": "income", "category": "Transfer", "description": "From Rohit"}]
"5000 from amol" → [{"amount": 5000, "type": "income", "category": "Transfer", "description": "From Amol"}]
"received 2k from priya" → [{"amount": 2000, "type": "income", "category": "Transfer", "description": "From Priya"}]
"loan from Rohit 2.5L" → [{"amount": 250000, "type": "income", "category": "Transfer", "description": "Loan from Rohit"}]
"lent 5000 to Rahul" → [{"amount": 5000, "type": "expense", "category": "Transfer", "description": "Lent to Rahul"}]
"lend to ashok 40k" → [{"amount": 40000, "type": "expense", "category": "Transfer", "description": "Lent to Ashok"}]
"given to dipesh 2000" → [{"amount": 2000, "type": "expense", "category": "Transfer", "description": "Given to Dipesh"}]
"4k from dipesh" → [{"amount": 4000, "type": "income", "category": "Transfer", "description": "From Dipesh"}]
"petrol by vinay 5k" → [{"amount": 5000, "type": "income", "category": "Transfer", "description": "From Vinay"}, {"amount": 5000, "type": "expense", "category": "Transport", "description": "Petrol"}]
"vinay paid for petrol 5k" → [{"amount": 5000, "type": "income", "category": "Transfer", "description": "From Vinay"}, {"amount": 5000, "type": "expense", "category": "Transport", "description": "Petrol"}]
"vinay paid petrol 5k" → [{"amount": 5000, "type": "income", "category": "Transfer", "description": "From Vinay"}, {"amount": 5000, "type": "expense", "category": "Transport", "description": "Petrol"}]
"dinner by rohit 2k" → [{"amount": 2000, "type": "income", "category": "Transfer", "description": "From Rohit"}, {"amount": 2000, "type": "expense", "category": "Food & Drinks", "description": "Dinner"}]
"rohit ne petrol bhara 3k" → [{"amount": 3000, "type": "income", "category": "Transfer", "description": "From Rohit"}, {"amount": 3000, "type": "expense", "category": "Transport", "description": "Petrol"}]
"vinay ne khana khilaya 1500" → [{"amount": 1500, "type": "income", "category": "Transfer", "description": "From Vinay"}, {"amount": 1500, "type": "expense", "category": "Food & Drinks", "description": "Khana"}]`;

interface ParsedTx {
  amount: number;
  type: "income" | "expense";
  category: string;
  description: string;
}

function isValidTx(tx: unknown): tx is ParsedTx {
  if (typeof tx !== "object" || tx === null) return false;
  const t = tx as Record<string, unknown>;
  return (
    typeof t.amount === "number" &&
    t.amount > 0 &&
    (t.type === "income" || t.type === "expense") &&
    typeof t.category === "string" &&
    VALID_CATEGORIES.includes(t.category as (typeof VALID_CATEGORIES)[number]) &&
    typeof t.description === "string" &&
    t.description.length > 0
  );
}

function mockParse(text: string, isSplitSpace = false): ParsedTx[] {
  const INCOME_KEYWORDS = ["salary", "income", "received", "from", "credit", "refund", "bonus", "freelance"];
  const CATEGORY_MAP: Record<string, string> = {
    coffee: "Food & Drinks", tea: "Food & Drinks", food: "Food & Drinks", lunch: "Food & Drinks",
    dinner: "Food & Drinks", breakfast: "Food & Drinks", restaurant: "Food & Drinks", swiggy: "Food & Drinks", zomato: "Food & Drinks",
    grocery: "Groceries", groceries: "Groceries", vegetables: "Groceries", fruits: "Groceries", milk: "Groceries",
    petrol: "Transport", uber: "Transport", ola: "Transport", auto: "Transport", bus: "Transport", metro: "Transport", fuel: "Transport",
    school: "Education", fees: "Education", tuition: "Education", college: "Education", course: "Education",
    rent: "Housing", electricity: "Bills", wifi: "Bills", internet: "Bills", phone: "Bills", recharge: "Bills",
    medicine: "Healthcare", doctor: "Healthcare", hospital: "Healthcare", pharmacy: "Healthcare",
    movie: "Entertainment", netflix: "Entertainment", game: "Entertainment", amazon: "Shopping", shopping: "Shopping", clothes: "Shopping",
    salary: "Salary", income: "Salary", business: "Business", investment: "Investment", travel: "Travel",
  };

  // First split on explicit delimiters (newline, comma, ·)
  const lines = text.split(/[\n,·]+/).map(s => s.trim()).filter(Boolean);

  // Then within each line, split on inline pattern: number followed by words, then another number
  // e.g. "20 oshin 30 pavan" → ["20 oshin", "30 pavan"]
  const segments: string[] = [];
  for (const line of lines) {
    const inlineMatches = [...line.matchAll(/(\d+(?:\.\d+)?)\s+([a-zA-Z][^0-9]*?)(?=\s*\d|$)/g)];
    if (inlineMatches.length > 1) {
      inlineMatches.forEach(m => segments.push((m[1] + " " + m[2]).trim()));
    } else {
      segments.push(line);
    }
  }

  const results: ParsedTx[] = [];

  for (const seg of segments) {
    const amountMatch = seg.match(/(\d+(?:\.\d+)?)\s*[kK]|\b(\d+(?:\.\d+)?)\b/);
    if (!amountMatch) continue;
    const raw = amountMatch[0];
    const amount = /[kK]$/.test(raw) ? parseFloat(raw) * 1000 : parseFloat(raw);
    if (amount <= 0) continue;

    const lower = seg.toLowerCase();

    // GROUP PAYMENT: "X by Name", "Name paid X", "Name ne X bhara/diya" — only in split spaces
    const byNameMatch = isSplitSpace ? lower.match(/^(.+?)\s+by\s+([a-z]+)/) : null;
    const namePaidMatch = isSplitSpace ? lower.match(/^([a-z]+)\s+(?:paid(?:\s+for)?|ne\s+\w+\s+(?:bhara|diya|khilaya))\s+(.+)/) : null;
    if (byNameMatch || namePaidMatch) {
      const name = byNameMatch ? byNameMatch[2] : namePaidMatch![1];
      const expenseWord = byNameMatch ? byNameMatch[1] : namePaidMatch![2].replace(/\d+[kK]?/g, "").trim();
      const capName = name.charAt(0).toUpperCase() + name.slice(1);
      let expCat = "Other";
      for (const [keyword, cat] of Object.entries(CATEGORY_MAP)) {
        if (expenseWord.includes(keyword)) { expCat = cat; break; }
      }
      const expDesc = expenseWord.split(" ").filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") || "Expense";
      results.push({ amount, type: "income", category: "Transfer", description: `From ${capName}` });
      results.push({ amount, type: "expense", category: expCat, description: expDesc });
      continue;
    }

    const isIncome = INCOME_KEYWORDS.some(k => lower.includes(k));
    let category = "Other";
    for (const [keyword, cat] of Object.entries(CATEGORY_MAP)) {
      if (lower.includes(keyword)) { category = cat; break; }
    }
    if (lower.match(/from\s+[a-z]/)) category = "Transfer";
    else if (isIncome && category === "Other") category = "Salary";

    const description = seg.replace(/\d+(?:\.\d+)?[kK]?/g, "").replace(/[₹$]/g, "").trim()
      .split(" ").filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") || "Transaction";

    results.push({ amount, type: isIncome ? "income" : "expense", category, description });
  }
  return results;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  let body: { text?: string; isSplitSpace?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400, headers: CORS_HEADERS });
  }

  const text = body.text?.trim();
  const isSplitSpace = body.isSplitSpace ?? false;
  if (!text) {
    return NextResponse.json({ error: "Missing text" }, { status: 400, headers: CORS_HEADERS });
  }

  const apiKey = process.env.GEMINI_API_KEY ?? "";
  const isMock = !apiKey;

  if (isMock) {
    const transactions = mockParse(text, isSplitSpace);
    if (transactions.length === 0) return NextResponse.json({ error: "Could not parse" }, { status: 422, headers: CORS_HEADERS });
    return NextResponse.json({ transactions }, { headers: CORS_HEADERS });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const splitContext = isSplitSpace ? "\n\nCONTEXT: This is a GROUP/SPLIT space. Apply the GROUP PAYMENT RULE (double entry) when someone paid for a group expense." : "\n\nCONTEXT: This is a PERSONAL space. Do NOT apply double entry. Treat 'petrol by vinay' as a single expense only.";
    const result = await model.generateContent(`${SYSTEM_PROMPT}${splitContext}\n\nUser input: ${text}`);
    const raw = result.response.text();

    const cleaned = raw.replace(/```json|```/g, "").trim();
    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "Could not parse AI response" }, { status: 422, headers: CORS_HEADERS });
    }

    const arr = Array.isArray(parsed) ? parsed : [parsed];
    const validTxs = arr.filter(isValidTx).map((tx) => {
      // Post-process: "From [Name]" descriptions are always person transfers
      if (/^From\s+[A-Z]/.test(tx.description)) {
        return { ...tx, category: "Transfer" };
      }
      // Post-process: "Lent to", "Given to", "Paid to [person name]" are always Transfer expenses
      // But NOT "To Watermelon", "To Swiggy" etc — only actual person names (no food/service keywords)
      const FOOD_SERVICE_KEYWORDS = ["watermelon", "watarmelon", "apple", "banana", "mango", "swiggy", "zomato", "amazon", "coffee", "tea", "chai", "grocery", "groceries", "petrol", "fuel", "rent", "bill", "medicine", "movie", "netflix", "uber", "ola"];
      if (/^(Lent|Given|Paid)\s+[Tt]o\s+[A-Z]/.test(tx.description)) {
        const lowerDesc = tx.description.toLowerCase();
        const isFoodOrService = FOOD_SERVICE_KEYWORDS.some(kw => lowerDesc.includes(kw));
        if (!isFoodOrService) return { ...tx, category: "Transfer", type: "expense" as const };
      }
      return tx;
    });

    if (validTxs.length === 0) {
      return NextResponse.json({ error: "No valid transactions found" }, { status: 422, headers: CORS_HEADERS });
    }

    return NextResponse.json({ transactions: validTxs }, { headers: CORS_HEADERS });
  } catch (err) {
    console.error("AI log parsing error:", err);
    return NextResponse.json({ error: "AI parsing failed" }, { status: 500, headers: CORS_HEADERS });
  }
}
