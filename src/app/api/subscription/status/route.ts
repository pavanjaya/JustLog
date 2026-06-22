import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ status: "none" });

  const { data, error } = await supabase
    .from("subscriptions")
    .select("status, valid_until, plan")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Subscription status error:", error);
  }

  if (data) {
    const validUntil = new Date(String(data.valid_until).replace(" ", "T"));
    const isActive = !isNaN(validUntil.getTime()) && validUntil > new Date() && data.status !== "cancelled";

    if (isActive) {
      return NextResponse.json({
        status: data.status === "trialing" ? "trialing" : "active",
        plan: data.plan ?? "monthly",
        validUntil: data.valid_until,
        existingUser: true,
        onboarded: true,
        freeChosen: false,
      });
    }

    return NextResponse.json({
      status: data.status === "free" ? "free" : "none",
      validUntil: data.valid_until,
      existingUser: true,
      onboarded: true,
      freeChosen: data.status === "free",
    });
  }

  return NextResponse.json({ status: "none", existingUser: false, onboarded: false, freeChosen: false });
}
