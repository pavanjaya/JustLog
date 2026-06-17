import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient, AI_MODEL } from "@/lib/anthropic";
import type { Transaction } from "@/types";

const SYSTEM_PROMPT = `You are JustLog's search assistant. The user has logged transaction data and wants to query it in natural language.

Answer the user's question in 1-3 natural sentences. Be specific with amounts using the ₹ symbol and Indian number formatting (e.g. ₹1,25,000). If no matching data is found, say so kindly. Keep it conversational and brief.`;

export async function POST(req: NextRequest) {
  let body: { query?: string; transactions?: Transaction[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const query = body.query?.trim();
  const transactions = body.transactions;

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }
  if (!Array.isArray(transactions)) {
    return NextResponse.json({ error: "Missing transactions" }, { status: 400 });
  }

  try {
    const anthropic = getAnthropicClient();

    const response = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Transactions: ${JSON.stringify(transactions)}\n\nQuestion: ${query}`,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const answer = textBlock && "text" in textBlock ? textBlock.text : "No answer found.";

    return NextResponse.json({ answer });
  } catch (err) {
    console.error("AI search error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
