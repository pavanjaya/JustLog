import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json({ error: "Not configured" }, { status: 500, headers: CORS_HEADERS });
  }

  let body: { orderId?: string; paymentId?: string; signature?: string; userId?: string; plan?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400, headers: CORS_HEADERS });
  }

  const { orderId, paymentId, signature, userId, plan } = body;
  if (!orderId || !paymentId || !signature || !userId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400, headers: CORS_HEADERS });
  }

  // Verify Razorpay signature
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  if (expected !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400, headers: CORS_HEADERS });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const isYearly = plan === "yearly";
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + (isYearly ? 365 : 30));

  // Delete all old subscriptions for this user and insert a fresh active one
  await supabase.from("subscriptions").delete().eq("user_id", userId);

  const { error } = await supabase.from("subscriptions").insert({
    user_id: userId,
    plan: plan ?? "monthly",
    status: "active",
    payment_id: paymentId,
    order_id: orderId,
    valid_until: validUntil.toISOString(),
  });

  if (error) {
    console.error("Supabase insert error:", error);
    return NextResponse.json({ error: "DB error", detail: error.message }, { status: 500, headers: CORS_HEADERS });
  }

  return NextResponse.json({ success: true }, { headers: CORS_HEADERS });
}
