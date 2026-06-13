import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/feed";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[auth/callback] exchangeCodeForSession error:", error.message, error.status);
    }
    if (!error) {
      // If the user already has a profile, skip onboarding.
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();
        const destination = profile ? (next === "/onboarding" ? "/feed" : next) : "/onboarding";
        return NextResponse.redirect(`${origin}${destination}`);
      }
    }
  }

  const reason = !code ? "no_code" : "exchange_failed";
  return NextResponse.redirect(`${origin}/login?error=auth&reason=${reason}`);
}
