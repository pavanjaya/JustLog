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
