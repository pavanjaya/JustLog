import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return NextResponse.json({ error: "Razorpay not configured" }, { status: 500, headers: CORS_HEADERS });
  }

  let body: { plan?: "monthly" | "yearly" };
  try { body = await req.json(); } catch { body = {}; }

  const plan = body.plan ?? "monthly";
  // ₹79/month or ₹599/year — amount in paise
  const amount = plan === "yearly" ? 59900 : 7900;
  const currency = "INR";

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

  try {
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: `jl_${plan}_${Date.now()}`,
      notes: { plan },
    });
    return NextResponse.json({ orderId: order.id, amount, currency, keyId }, { headers: CORS_HEADERS });
  } catch (err) {
    console.error("Razorpay order error:", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500, headers: CORS_HEADERS });
  }
}
