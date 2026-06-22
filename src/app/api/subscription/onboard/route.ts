import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

// Called when user completes onboarding or chooses "Continue Free"
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { freeChosen } = await req.json().catch(() => ({ freeChosen: false }));

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: existing } = await admin
    .from("subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    await admin
      .from("subscriptions")
      .update({ onboarded: true, ...(freeChosen ? { free_chosen: true } : {}) })
      .eq("id", existing.id);
  } else {
    // No subscription row yet — create a placeholder so we can store onboarded flag
    await admin.from("subscriptions").insert({
      user_id: user.id,
      plan: "free",
      status: "free",
      valid_until: new Date(0).toISOString(), // epoch = effectively expired
      onboarded: true,
      free_chosen: freeChosen ?? false,
    });
  }

  return NextResponse.json({ success: true });
}
