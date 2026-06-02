/**
 * Google OAuth (authorization-code + offline refresh token) for server-side
 * Search Console access using the owner's own Google account, instead of a
 * service account. This sidesteps having to add a service account as a user on
 * the Search Console property.
 *
 * Env:
 *   GOOGLE_OAUTH_CLIENT_ID     — OAuth 2.0 Web client ID (Google Cloud → Credentials)
 *   GOOGLE_OAUTH_CLIENT_SECRET — its client secret
 *
 * The refresh token is captured by the one-time consent flow (the "Connect
 * Google account" button) and stored in the integration_tokens table.
 */
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const PROVIDER = "google_search_console";
const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v2/userinfo";
// openid+email so we can record which account connected; the readonly scope is
// what actually grants Search Console access.
export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/webmasters.readonly",
].join(" ");

export function googleOAuthClientConfigured(): boolean {
  return (
    !!process.env.GOOGLE_OAUTH_CLIENT_ID?.trim() &&
    !!process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim()
  );
}

/** Build the Google consent URL. `prompt=consent` forces a refresh token. */
export function buildGoogleAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_SCOPES,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

/** Exchange an authorization code for tokens; persist the refresh token. */
export async function exchangeCodeAndStore(
  code: string,
  redirectUri: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
        client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
      cache: "no-store",
    });
    const tok = (await res.json()) as TokenResponse;
    if (!res.ok || !tok.refresh_token) {
      // No refresh_token usually means the user previously consented and Google
      // didn't re-issue one; prompt=consent should prevent this.
      return {
        ok: false,
        error:
          tok.error_description ||
          tok.error ||
          (tok.access_token
            ? "Google did not return a refresh token. Remove this app's access at myaccount.google.com/permissions and try again."
            : "Token exchange failed."),
      };
    }

    let email: string | null = null;
    if (tok.access_token) {
      try {
        const ui = await fetch(USERINFO_ENDPOINT, {
          headers: { Authorization: `Bearer ${tok.access_token}` },
          cache: "no-store",
        });
        if (ui.ok) email = ((await ui.json()) as { email?: string }).email ?? null;
      } catch {
        /* userinfo is best-effort */
      }
    }

    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("integration_tokens").upsert({
      provider: PROVIDER,
      refresh_token: tok.refresh_token,
      account_email: email,
      scope: tok.scope ?? GOOGLE_SCOPES,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      console.error("[google-oauth] failed to store token", error);
      return { ok: false, error: "Could not save the token." };
    }
    return { ok: true };
  } catch (err) {
    console.error("[google-oauth] exchange threw", err);
    return { ok: false, error: "Token exchange failed." };
  }
}

async function getStoredToken(): Promise<{
  refresh_token: string;
  account_email: string | null;
} | null> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("integration_tokens")
    .select("refresh_token, account_email")
    .eq("provider", PROVIDER)
    .maybeSingle();
  return data ?? null;
}

/** Mint an access token from the stored refresh token, or null if not connected. */
export async function getGoogleAccessToken(): Promise<string | null> {
  if (!googleOAuthClientConfigured()) return null;
  const stored = await getStoredToken();
  if (!stored?.refresh_token) return null;
  try {
    const res = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: stored.refresh_token,
        client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
        client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
        grant_type: "refresh_token",
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[google-oauth] refresh failed", res.status, await res.text());
      return null;
    }
    const tok = (await res.json()) as TokenResponse;
    return tok.access_token ?? null;
  } catch (err) {
    console.error("[google-oauth] refresh threw", err);
    return null;
  }
}

export async function googleOAuthStatus(): Promise<{
  clientConfigured: boolean;
  connected: boolean;
  email: string | null;
}> {
  const clientConfigured = googleOAuthClientConfigured();
  const stored = clientConfigured ? await getStoredToken() : null;
  return {
    clientConfigured,
    connected: !!stored?.refresh_token,
    email: stored?.account_email ?? null,
  };
}

/** Disconnect: forget the stored refresh token. */
export async function clearGoogleToken(): Promise<void> {
  const admin = createSupabaseAdminClient();
  await admin.from("integration_tokens").delete().eq("provider", PROVIDER);
}
