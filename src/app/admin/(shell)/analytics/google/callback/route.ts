import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { requireOwner } from "@/app/admin/_actions/guard";
import { exchangeCodeAndStore } from "@/lib/google-oauth";

export const dynamic = "force-dynamic";

/**
 * Google OAuth callback. Owner-gated. Verifies the CSRF state, exchanges the
 * code for a refresh token (stored in integration_tokens), and returns to the
 * analytics dashboard with a status flag.
 */
export async function GET(req: NextRequest) {
  await requireOwner();

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const savedState = (await cookies()).get("g_oauth_state")?.value;
  const back = (flag: string) =>
    NextResponse.redirect(new URL(`/admin/analytics?gsc=${flag}`, req.url));

  let res: NextResponse;
  if (oauthError) {
    res = back("denied");
  } else if (!code || !state || !savedState || state !== savedState) {
    res = back("state_mismatch");
  } else {
    const redirectUri = `${url.origin}/admin/analytics/google/callback`;
    const result = await exchangeCodeAndStore(code, redirectUri);
    res = back(result.ok ? "connected" : "exchange_failed");
  }

  res.cookies.delete("g_oauth_state");
  return res;
}
