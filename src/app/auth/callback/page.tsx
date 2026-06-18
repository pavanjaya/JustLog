"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/");
      } else {
        // Handle token hash from URL (PKCE or implicit flow)
        supabase.auth.onAuthStateChange((event, session) => {
          if (event === "SIGNED_IN" && session) {
            router.replace("/");
          }
        });
      }
    });
  }, [router]);

  return (
    <div className="flex items-center justify-center" style={{ minHeight: "100dvh" }}>
      <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#C831FF", borderTopColor: "transparent" }} />
    </div>
  );
}
