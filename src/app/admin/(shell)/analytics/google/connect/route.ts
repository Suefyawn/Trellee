import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { requireOwner } from "@/app/admin/_actions/guard";
import {
  buildGoogleAuthUrl,
  googleOAuthClientConfigured,
} from "@/lib/google-oauth";

export const dynamic = "force-dynamic";

/**
 * Kicks off the Google consent flow. Owner-gated. Sets a short-lived state
 * cookie (CSRF) and redirects to Google's consent screen.
 */
export async function GET(req: NextRequest) {
  await requireOwner();

  if (!googleOAuthClientConfigured()) {
    return NextResponse.redirect(
      new URL("/admin/analytics?gsc=oauth_unconfigured", req.url),
    );
  }

  const origin = new URL(req.url).origin;
  const redirectUri = `${origin}/admin/analytics/google/callback`;
  const state = crypto.randomUUID();

  const res = NextResponse.redirect(buildGoogleAuthUrl(redirectUri, state));
  res.cookies.set("g_oauth_state", state, {
    httpOnly: true,
    // Secure in production; allow http://localhost so the OAuth state cookie
    // round-trips during local development (it wouldn't be sent over plain http).
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: 600,
  });
  return res;
}
