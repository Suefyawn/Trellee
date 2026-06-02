/**
 * Server-side Google Search Console client for the admin analytics dashboard.
 * Authenticates with a service-account JWT (no external SDK) and reads Search
 * Analytics: total clicks/impressions/CTR/position, top queries, and top pages.
 *
 * Env:
 *   GSC_SERVICE_ACCOUNT_JSON — the full service-account JSON (string). Create a
 *     service account in Google Cloud, enable the Search Console API, download
 *     the JSON key, and add the service account's email as a user on the
 *     property in Search Console (Settings → Users and permissions).
 *   GSC_SITE_URL — the verified property, e.g. "https://trellee.com/" or the
 *     domain property form "sc-domain:trellee.com".
 *
 * loadGsc() returns { snapshot, error }: a snapshot when it works, or a
 * human-readable error when configured-but-failing, so the dashboard can
 * explain *why* instead of showing a generic "connect" card.
 */
import crypto from "node:crypto";
import { getGoogleAccessToken } from "@/lib/google-oauth";

export function gscConfigured(): boolean {
  return (
    !!process.env.GSC_SERVICE_ACCOUNT_JSON?.trim() &&
    !!process.env.GSC_SITE_URL?.trim()
  );
}

export function gscEnvStatus() {
  const raw = process.env.GSC_SERVICE_ACCOUNT_JSON ?? "";
  let email = "";
  try {
    email = (JSON.parse(raw) as { client_email?: string }).client_email ?? "";
  } catch {
    /* malformed JSON — leave email blank */
  }
  return {
    account: raw.trim().length > 0,
    site: process.env.GSC_SITE_URL?.trim() ?? "",
    serviceEmail: email, // safe to show: it's the address you grant access to
  };
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

type ServiceAccount = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

/** Mint a short-lived access token via the service-account JWT-bearer flow. */
async function getAccessToken(): Promise<string | null> {
  const raw = process.env.GSC_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  let sa: ServiceAccount;
  try {
    sa = JSON.parse(raw) as ServiceAccount;
  } catch {
    console.error("[gsc] GSC_SERVICE_ACCOUNT_JSON is not valid JSON");
    return null;
  }
  if (!sa.client_email || !sa.private_key) return null;

  const tokenUri = sa.token_uri || "https://oauth2.googleapis.com/token";
  const iat = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/webmasters.readonly",
      aud: tokenUri,
      iat,
      exp: iat + 3600,
    }),
  );
  const signingInput = `${header}.${claim}`;

  let signature: Buffer;
  try {
    signature = crypto
      .createSign("RSA-SHA256")
      .update(signingInput)
      // Allow keys stored with escaped newlines in a single-line env var.
      .sign(sa.private_key.replace(/\\n/g, "\n"));
  } catch (err) {
    console.error("[gsc] JWT signing failed", err);
    return null;
  }
  const assertion = `${signingInput}.${b64url(signature)}`;

  try {
    const res = await fetch(tokenUri, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[gsc] token exchange failed", res.status, await res.text());
      return null;
    }
    const j = (await res.json()) as { access_token?: string };
    return j.access_token ?? null;
  } catch (err) {
    console.error("[gsc] token exchange threw", err);
    return null;
  }
}

type GscApiRow = {
  keys?: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type GscSnapshot = {
  rangeDays: number;
  totals: { clicks: number; impressions: number; ctr: number; position: number };
  topQueries: {
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }[];
  topPages: { page: string; clicks: number; impressions: number }[];
};

export type GscResult = { snapshot: GscSnapshot | null; error: string | null };

/** Load a Search Console snapshot for the last `days` days (with a reason on failure). */
export async function loadGsc(days = 28): Promise<GscResult> {
  const site = process.env.GSC_SITE_URL?.trim();
  if (!site) return { snapshot: null, error: null };

  // Prefer the owner's OAuth token (no Search Console user grant needed); fall
  // back to a service account if one is configured.
  const oauthToken = await getGoogleAccessToken();
  const usingOAuth = !!oauthToken;
  const token = oauthToken ?? (await getAccessToken());
  if (!token) {
    if (process.env.GSC_SERVICE_ACCOUNT_JSON?.trim()) {
      return {
        snapshot: null,
        error:
          "Could not authenticate the service account. Check that GSC_SERVICE_ACCOUNT_JSON is the complete, unmodified key file (including the full private_key), and that the Search Console API is enabled in the Google Cloud project.",
      };
    }
    // No auth method connected yet — show the connect options, not an error.
    return { snapshot: null, error: null };
  }
  // GSC data lags ~2 days; offset the window so the latest rows aren't empty.
  const end = new Date(Date.now() - 2 * 86400000);
  const start = new Date(end.getTime() - days * 86400000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
    site,
  )}/searchAnalytics/query`;

  async function q(
    dimensions: string[],
    rowLimit: number,
  ): Promise<{ rows: GscApiRow[] | null; status?: number; message?: string }> {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate: fmt(start),
          endDate: fmt(end),
          dimensions,
          rowLimit,
        }),
        cache: "no-store",
      });
      if (!res.ok) {
        const body = await res.text();
        let message = body.slice(0, 300);
        try {
          message =
            (JSON.parse(body) as { error?: { message?: string } }).error?.message ??
            message;
        } catch {
          /* non-JSON error body — keep the raw slice */
        }
        console.error("[gsc] query failed", res.status, body);
        return { rows: null, status: res.status, message };
      }
      const j = (await res.json()) as { rows?: GscApiRow[] };
      return { rows: j.rows ?? [] };
    } catch (err) {
      console.error("[gsc] query threw", err);
      return { rows: null, message: String(err) };
    }
  }

  const [overall, queries, pages] = await Promise.all([
    q([], 1),
    q(["query"], 10),
    q(["page"], 10),
  ]);

  if (overall.rows === null) {
    const who = usingOAuth
      ? "the connected Google account"
      : `"${gscEnvStatus().serviceEmail || "the service account"}"`;
    const hint =
      overall.status === 403
        ? ` ${who} doesn't have access to the ${site} property in Search Console — it must be a user/owner on that exact property, and the property must be verified.`
        : overall.status === 404
          ? ` No Search Console property matches GSC_SITE_URL = "${site}". Check the exact form: "sc-domain:trellee.com" for a Domain property, or "https://trellee.com/" for a URL-prefix property.`
          : "";
    return {
      snapshot: null,
      error: `Search Console API error${
        overall.status ? ` (${overall.status})` : ""
      }: ${overall.message ?? "unknown"}.${hint}`,
    };
  }

  const tot = overall.rows[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  return {
    snapshot: {
      rangeDays: days,
      totals: {
        clicks: tot.clicks ?? 0,
        impressions: tot.impressions ?? 0,
        ctr: tot.ctr ?? 0,
        position: tot.position ?? 0,
      },
      topQueries: (queries.rows ?? []).map((r) => ({
        query: r.keys?.[0] ?? "",
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
      })),
      topPages: (pages.rows ?? []).map((r) => ({
        page: r.keys?.[0] ?? "",
        clicks: r.clicks,
        impressions: r.impressions,
      })),
    },
    error: null,
  };
}
