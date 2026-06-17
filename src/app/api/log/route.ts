import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient, AI_MODEL } from "@/lib/anthropic";

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
    "description": <clean title case, e.g. "Morning Coffee", "School Fees", "Income from Jaya">
  }
]

Rules:
- salary/received/income/from [person] = "income"; everything else = "expense"
- Each line or item = separate object in the array
- Return ONLY the JSON array, nothing else`;

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

  const lines = text.split(/[\n,·]+/).map(s => s.trim()).filter(Boolean);
  const results: ParsedTx[] = [];

  for (const line of lines) {
    const amountMatch = line.match(/\d+(\.\d+)?/);
    if (!amountMatch) continue;
    const amount = parseFloat(amountMatch[0]);
    if (amount <= 0) continue;

    const lower = line.toLowerCase();
    const isIncome = INCOME_KEYWORDS.some(k => lower.includes(k));
    let category = "Other";
    for (const [keyword, cat] of Object.entries(CATEGORY_MAP)) {
      if (lower.includes(keyword)) { category = cat; break; }
    }
    if (isIncome && category === "Other") category = "Salary";

    const description = line.replace(/\d+(\.\d+)?/g, "").replace(/[₹$]/g, "").trim()
      .split(" ").filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") || "Transaction";

    results.push({ amount, type: isIncome ? "income" : "expense", category, description });
  }
  return results;
}

export async function POST(req: NextRequest) {
  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const text = body.text?.trim();
  if (!text) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY ?? "";
  const isMock = !apiKey || apiKey.includes("xxx");

  if (isMock) {
    const transactions = mockParse(text);
    if (transactions.length === 0) return NextResponse.json({ error: "Could not parse" }, { status: 422 });
    return NextResponse.json({ transactions });
  }

  try {
    const anthropic = getAnthropicClient();

    const response = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: text }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const raw = textBlock && "text" in textBlock ? textBlock.text : "";

    const cleaned = raw.replace(/```json|```/g, "").trim();
    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "Could not parse AI response" }, { status: 422 });
    }

    const arr = Array.isArray(parsed) ? parsed : [parsed];
    const validTxs = arr.filter(isValidTx);

    if (validTxs.length === 0) {
      return NextResponse.json({ error: "No valid transactions found" }, { status: 422 });
    }

    return NextResponse.json({ transactions: validTxs });
  } catch (err) {
    console.error("AI log parsing error:", err);
    return NextResponse.json({ error: "AI parsing failed" }, { status: 500 });
  }
}
