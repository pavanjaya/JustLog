import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import type { Transaction } from "@/types";

const SYSTEM_PROMPT = `You are JustLog's search assistant. The user has logged transaction data and wants to query it in natural language.

Answer the user's question in 1-3 natural sentences. Be specific with amounts using the ₹ symbol and Indian number formatting (e.g. ₹1,25,000). If no matching data is found, say so kindly. Keep it conversational and brief.`;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  let body: { query?: string; transactions?: Transaction[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400, headers: CORS_HEADERS });
  }

  const query = body.query?.trim();
  const transactions = body.transactions;

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400, headers: CORS_HEADERS });
  }
  if (!Array.isArray(transactions)) {
    return NextResponse.json({ error: "Missing transactions" }, { status: 400, headers: CORS_HEADERS });
  }

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? "" });

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 1000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Transactions: ${JSON.stringify(transactions)}\n\nQuestion: ${query}` },
      ],
    });

    const answer = response.choices[0]?.message?.content ?? "No answer found.";

    return NextResponse.json({ answer }, { headers: CORS_HEADERS });
  } catch (err) {
    console.error("AI search error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500, headers: CORS_HEADERS });
  }
}
