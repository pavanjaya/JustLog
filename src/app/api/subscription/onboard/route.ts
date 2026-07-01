import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

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
    .maybeSingle();

  if (existing) {
    await admin
      .from("subscriptions")
      .update({ onboarded: true, ...(freeChosen ? { free_chosen: true, status: "free" } : {}) })
      .eq("id", existing.id);
  } else {
    await admin.from("subscriptions").insert({
      user_id: user.id,
      plan: "free",
      status: "free",
      valid_until: new Date(0).toISOString(),
      onboarded: true,
      free_chosen: freeChosen ?? false,
    });
  }

  return NextResponse.json({ success: true });
}
