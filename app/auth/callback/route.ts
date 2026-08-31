import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Exchanges the PKCE code from Supabase auth links (password recovery,
 * invites) for a cookie session, then forwards to `next`. Lives under
 * /auth, which the middleware treats as public.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next") ?? "/";

  // Only allow same-origin relative paths (no protocol-relative "//host").
  const next =
    requestedNext.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error("auth code exchange failed:", error);
  }

  return NextResponse.redirect(`${origin}/login?error=recovery`);
}
