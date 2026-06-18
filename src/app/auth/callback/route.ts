import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    // If tokens available, redirect to custom scheme so Android app catches it
    if (data?.session) {
      const { access_token, refresh_token } = data.session;
      const appUrl = `com.justlog.app://auth/callback#access_token=${access_token}&refresh_token=${refresh_token}&type=magiclink`;
      return NextResponse.redirect(appUrl);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
