import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
  try { body = await req.json(); } catch {
    return NextResponse.json({ text: "" }, { status: 400, headers: CORS_HEADERS });
  }

  const text = body.text?.trim();
  if (!text) return NextResponse.json({ text: "" }, { headers: CORS_HEADERS });

  const apiKey = process.env.GEMINI_API_KEY ?? "";
  if (!apiKey) return NextResponse.json({ text }, { headers: CORS_HEADERS });

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(
      `You are a voice input cleaner for a personal finance app. The user spoke a transaction and speech recognition may have made errors.

Fix ONLY speech recognition mistakes. Common errors:
- "forty" when context means "for tea" → "for tea"
- "to" vs "two", "for" vs "four", "won" vs "one"
- Number words mixed with digits: "sixty rupees" → "60 rupees"
- Mishearing similar-sounding words in Indian English

Return ONLY the corrected text, nothing else. If the text is already correct, return it as-is.

Input: "${text}"
Corrected:`
    );

    const cleaned = result.response.text().trim();
    return NextResponse.json({ text: cleaned }, { headers: CORS_HEADERS });
  } catch {
    return NextResponse.json({ text }, { headers: CORS_HEADERS });
  }
}
