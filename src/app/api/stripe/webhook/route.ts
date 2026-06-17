import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = await createClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    if (!userId) return NextResponse.json({ ok: true });

    const subId = session.subscription as string;
    const sub = await stripe.subscriptions.retrieve(subId);

    await supabase.from("subscriptions").upsert({
      user_id: userId,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: subId,
      status: sub.status,
      trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
    }, { onConflict: "user_id" });
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const userId = sub.metadata?.user_id;
    if (!userId) return NextResponse.json({ ok: true });

    await supabase.from("subscriptions").upsert({
      user_id: userId,
      stripe_customer_id: sub.customer as string,
      stripe_subscription_id: sub.id,
      status: sub.status,
      trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
    }, { onConflict: "user_id" });
  }

  return NextResponse.json({ ok: true });
}
