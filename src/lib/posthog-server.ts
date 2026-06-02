/**
 * Server-side PostHog query client for the admin analytics dashboard.
 * Runs HogQL via the PostHog query API using a personal API key (read scope).
 *
 * Env:
 *   POSTHOG_PERSONAL_API_KEY — PostHog → Settings → Personal API keys (read)
 *   POSTHOG_PROJECT_ID       — PostHog → Settings → Project ID (numeric)
 *   NEXT_PUBLIC_POSTHOG_HOST — ingest host (defaults to us.i.posthog.com)
 *
 * Returns null on any failure so the dashboard degrades gracefully.
 */

const HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST?.replace(/\/$/, "") ??
  "https://us.i.posthog.com";
const KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const PROJECT = process.env.POSTHOG_PROJECT_ID;

export function analyticsConfigured(): boolean {
  return !!process.env.POSTHOG_PERSONAL_API_KEY && !!process.env.POSTHOG_PROJECT_ID;
}

/**
 * Safe diagnostic for the "Connect" panel: reports which env vars the running
 * server can see, WITHOUT ever exposing their values. `key`/`project` are just
 * presence booleans; `projectIdLen` helps catch an accidentally-empty or
 * whitespace value.
 */
export function analyticsEnvStatus() {
  const key = process.env.POSTHOG_PERSONAL_API_KEY ?? "";
  const project = process.env.POSTHOG_PROJECT_ID ?? "";
  return {
    key: key.trim().length > 0,
    project: project.trim().length > 0,
    projectId: project.trim(), // the project id is not a secret
    keyPrefix: key.trim().slice(0, 4), // e.g. "phx_" / "phc_" — helps spot a wrong key type
    host: HOST,
  };
}

/** Run a HogQL query; returns an array of row-arrays, or null if unavailable. */
export async function hogql(query: string): Promise<unknown[][] | null> {
  if (!KEY || !PROJECT) return null;
  try {
    const res = await fetch(`${HOST}/api/projects/${PROJECT}/query/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${KEY}`,
      },
      body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[posthog] query failed", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as { results?: unknown[][] };
    return data.results ?? [];
  } catch (err) {
    console.error("[posthog] query threw", err);
    return null;
  }
}

export type AnalyticsSnapshot = {
  pageviews7d: number;
  visitors7d: number;
  pageviewsPrev7d: number;
  trend: { date: string; pageviews: number; visitors: number }[];
  topPages: { path: string; views: number }[];
  topSources: { source: string; views: number }[];
  devices: { device: string; views: number }[];
  countries: { country: string; views: number }[];
  conversions: { event: string; count: number }[];
  bookingFunnel: { pageviews: number; bookPage: number; submitted: number };
  recent: { time: string; event: string; path: string }[];
};

const n = (v: unknown) => Number(v ?? 0);
const s = (v: unknown) => String(v ?? "");

/** Fetch the full dashboard snapshot in parallel. Returns null if not configured. */
export async function getAnalyticsSnapshot(): Promise<AnalyticsSnapshot | null> {
  if (!analyticsConfigured()) return null;

  const [
    kpis,
    prev,
    trend,
    topPages,
    topSources,
    devices,
    countries,
    conversions,
    funnel,
    recent,
  ] = await Promise.all([
    hogql(
      `SELECT count() , count(distinct person_id) FROM events WHERE event = '$pageview' AND timestamp >= now() - INTERVAL 7 DAY`,
    ),
    hogql(
      `SELECT count() FROM events WHERE event = '$pageview' AND timestamp >= now() - INTERVAL 14 DAY AND timestamp < now() - INTERVAL 7 DAY`,
    ),
    hogql(
      `SELECT toDate(timestamp) AS d, count() , count(distinct person_id) FROM events WHERE event = '$pageview' AND timestamp >= now() - INTERVAL 14 DAY GROUP BY d ORDER BY d`,
    ),
    hogql(
      `SELECT properties.$pathname AS path, count() AS c FROM events WHERE event = '$pageview' AND timestamp >= now() - INTERVAL 7 DAY GROUP BY path ORDER BY c DESC LIMIT 10`,
    ),
    hogql(
      `SELECT coalesce(nullif(properties.$referring_domain, ''), '$direct') AS src, count() AS c FROM events WHERE event = '$pageview' AND timestamp >= now() - INTERVAL 7 DAY GROUP BY src ORDER BY c DESC LIMIT 8`,
    ),
    hogql(
      `SELECT coalesce(nullif(properties.$device_type, ''), 'Unknown') AS d, count() AS c FROM events WHERE event = '$pageview' AND timestamp >= now() - INTERVAL 7 DAY GROUP BY d ORDER BY c DESC`,
    ),
    hogql(
      `SELECT coalesce(nullif(properties.$geoip_country_name, ''), 'Unknown') AS c, count() AS n FROM events WHERE event = '$pageview' AND timestamp >= now() - INTERVAL 7 DAY GROUP BY c ORDER BY n DESC LIMIT 6`,
    ),
    hogql(
      `SELECT event, count() AS c FROM events WHERE event IN ('booking_submitted', 'contact_submitted', 'newsletter_subscribed') AND timestamp >= now() - INTERVAL 30 DAY GROUP BY event ORDER BY c DESC`,
    ),
    hogql(
      `SELECT
         countIf(event = '$pageview') ,
         countIf(event = '$pageview' AND properties.$pathname = '/book') ,
         countIf(event = 'booking_submitted')
       FROM events WHERE timestamp >= now() - INTERVAL 30 DAY`,
    ),
    hogql(
      `SELECT timestamp, event, coalesce(properties.$pathname, '') AS path FROM events ORDER BY timestamp DESC LIMIT 20`,
    ),
  ]);

  // If the core query failed (bad key / project), treat the whole thing as unavailable.
  if (kpis === null) return null;

  return {
    pageviews7d: n(kpis[0]?.[0]),
    visitors7d: n(kpis[0]?.[1]),
    pageviewsPrev7d: n(prev?.[0]?.[0]),
    trend: (trend ?? []).map((r) => ({
      date: s(r[0]),
      pageviews: n(r[1]),
      visitors: n(r[2]),
    })),
    topPages: (topPages ?? []).map((r) => ({ path: s(r[0]) || "/", views: n(r[1]) })),
    topSources: (topSources ?? []).map((r) => ({
      source: s(r[0]) === "$direct" ? "Direct / none" : s(r[0]),
      views: n(r[1]),
    })),
    devices: (devices ?? []).map((r) => ({ device: s(r[0]), views: n(r[1]) })),
    countries: (countries ?? []).map((r) => ({ country: s(r[0]), views: n(r[1]) })),
    conversions: (conversions ?? []).map((r) => ({ event: s(r[0]), count: n(r[1]) })),
    bookingFunnel: {
      pageviews: n(funnel?.[0]?.[0]),
      bookPage: n(funnel?.[0]?.[1]),
      submitted: n(funnel?.[0]?.[2]),
    },
    recent: (recent ?? []).map((r) => ({
      time: s(r[0]),
      event: s(r[1]),
      path: s(r[2]),
    })),
  };
}
