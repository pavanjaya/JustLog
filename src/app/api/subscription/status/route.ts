import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ status: "none" });

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data } = await admin
    .from("subscriptions")
    .select("status, valid_until, plan")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (data) {
    const validUntil = new Date(data.valid_until);
    if (validUntil > new Date() && data.status !== "cancelled") {
      return NextResponse.json({
        status: data.status === "trialing" ? "trialing" : "active",
        plan: data.plan ?? "monthly",
        validUntil: data.valid_until,
        existingUser: true,
      });
    }
    // Expired — return the validUntil so trial-expiry detection works
    return NextResponse.json({ status: "none", validUntil: data.valid_until, existingUser: true });
  }

  return NextResponse.json({ status: "none", existingUser: false });
}
