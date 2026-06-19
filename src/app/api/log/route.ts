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
- SALARY vs TRANSFER: "salary", "stipend", "paycheck", "income" keywords = "Salary" category. But "from [person name]" (e.g. "4k from Jaya", "got 500 from Rahul") = "Transfer" category — it's a person sending money, not an employer paying salary.
- DESCRIPTION: ALWAYS fix spelling mistakes before writing the description. Use your language knowledge to correct ANY misspelling — do not copy the user's spelling. Examples: "cofee"→"Coffee", "icecreame"→"Ice Cream", "restraunt"→"Restaurant", "medecine"→"Medicine", "statinory"→"Stationery", "pomogranade"→"Pomegranate", "brocolli"→"Broccoli". Use clean title case. Do NOT include the amount. Preserve meaningful words like "Loan", "Rent", "Fee".
- CATEGORY PRIORITY (higher rules override lower ones):
  1. loan/borrowed/lent/gave loan = "Transfer" (HIGHEST PRIORITY — overrides all other rules)
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
"loan from Rohit 2.5L" → [{"amount": 250000, "type": "income", "category": "Transfer", "description": "Loan from Rohit"}]
"lent 5000 to Rahul" → [{"amount": 5000, "type": "expense", "category": "Transfer", "description": "Lent to Rahul"}]
"lend to ashok 40k" → [{"amount": 40000, "type": "expense", "category": "Transfer", "description": "Lent to Ashok"}]`;

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

function mockParse(text: string): ParsedTx[] {
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
    const amountMatch = seg.match(/\d+(\.\d+)?/);
    if (!amountMatch) continue;
    const amount = parseFloat(amountMatch[0]);
    if (amount <= 0) continue;

    const lower = seg.toLowerCase();
    const isIncome = INCOME_KEYWORDS.some(k => lower.includes(k));
    let category = "Other";
    for (const [keyword, cat] of Object.entries(CATEGORY_MAP)) {
      if (lower.includes(keyword)) { category = cat; break; }
    }
    if (isIncome && category === "Other") category = "Salary";

    const description = seg.replace(/\d+(\.\d+)?/g, "").replace(/[₹$]/g, "").trim()
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
  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400, headers: CORS_HEADERS });
  }

  const text = body.text?.trim();
  if (!text) {
    return NextResponse.json({ error: "Missing text" }, { status: 400, headers: CORS_HEADERS });
  }

  const apiKey = process.env.GEMINI_API_KEY ?? "";
  const isMock = !apiKey;

  if (isMock) {
    const transactions = mockParse(text);
    if (transactions.length === 0) return NextResponse.json({ error: "Could not parse" }, { status: 422, headers: CORS_HEADERS });
    return NextResponse.json({ transactions }, { headers: CORS_HEADERS });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const response = await model.generateContent(`${SYSTEM_PROMPT}\n\n${text}`);
    const raw = response.response.text();

    const cleaned = raw.replace(/```json|```/g, "").trim();
    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "Could not parse AI response" }, { status: 422, headers: CORS_HEADERS });
    }

    const arr = Array.isArray(parsed) ? parsed : [parsed];
    const validTxs = arr.filter(isValidTx);

    if (validTxs.length === 0) {
      return NextResponse.json({ error: "No valid transactions found" }, { status: 422, headers: CORS_HEADERS });
    }

    return NextResponse.json({ transactions: validTxs }, { headers: CORS_HEADERS });
  } catch (err) {
    console.error("AI log parsing error:", err);
    return NextResponse.json({ error: "AI parsing failed" }, { status: 500, headers: CORS_HEADERS });
  }
}
