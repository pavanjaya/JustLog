import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Transaction } from "@/types";

const SYSTEM_PROMPT = `You are JustLog's search assistant. The user has logged transaction data and wants to query it in natural language.

Answer the user's question in 1-3 natural sentences. Always include the date and time when relevant (e.g. "on 19 Jun at 2:30 pm"). Be specific with amounts using the ₹ symbol and Indian number formatting (e.g. ₹1,25,000). If no matching data is found, say so kindly. Keep it conversational and brief.`;

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

  const apiKey = process.env.GEMINI_API_KEY ?? "";
  if (!apiKey) {
    return NextResponse.json({ answer: "Search requires an AI key — not configured yet." }, { headers: CORS_HEADERS });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const txSummary = transactions.slice(-200).map(tx =>
      `${tx.created_at.slice(0, 10)} | ${tx.type} | ${tx.category} | ${tx.description} | ₹${tx.amount}`
    ).join("\n");

    const response = await model.generateContent(
      `${SYSTEM_PROMPT}\n\nTransactions:\n${txSummary}\n\nQuestion: ${query}`
    );
    const answer = response.response.text() || "No answer found.";

    return NextResponse.json({ answer }, { headers: CORS_HEADERS });
  } catch (err) {
    console.error("AI search error:", err);
    const msg = err instanceof Error ? err.message : "";
    const friendly = msg.includes("rate_limit") || msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")
      ? "AI search is temporarily unavailable (daily limit reached). Try again in a few minutes."
      : "Couldn't process that right now.";
    return NextResponse.json({ error: friendly }, { status: 500, headers: CORS_HEADERS });
  }
}
