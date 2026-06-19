import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { reason } = await req.json();

  await supabase
    .from("subscriptions")
    .update({ status: "cancelled", cancel_reason: reason })
    .eq("user_id", user.id);

  return NextResponse.json({ success: true });
}
