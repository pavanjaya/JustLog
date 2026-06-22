import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: existing } = await admin
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing && existing.status === "trialing") {
    return NextResponse.json({ error: "Trial already used" }, { status: 400 });
  }

  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 7);

  if (existing) {
    await admin.from("subscriptions").update({
      status: "trialing",
      current_period_end: trialEnd.toISOString(),
      onboarded: true,
      free_chosen: false,
    }).eq("user_id", user.id);
  } else {
    await admin.from("subscriptions").insert({
      user_id: user.id,
      status: "trialing",
      current_period_end: trialEnd.toISOString(),
      onboarded: true,
      free_chosen: false,
    });
  }

  return NextResponse.json({ success: true, validUntil: trialEnd.toISOString() });
}
