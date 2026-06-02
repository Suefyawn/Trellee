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

/** Allowed dashboard ranges (days). */
export const RANGES = [7, 30, 90] as const;
export type RangeDays = (typeof RANGES)[number];

export function normalizeRange(v: unknown): RangeDays {
  const n = Number(v);
  return (RANGES as readonly number[]).includes(n) ? (n as RangeDays) : 7;
}

export type AnalyticsSnapshot = {
  rangeDays: number;
  totals: {
    pageviews: number;
    visitors: number;
    sessions: number;
    conversions: number;
    pageviewsPrev: number;
    visitorsPrev: number;
    sessionsPrev: number;
    conversionsPrev: number;
  };
  bounceRate: number; // 0–100, share of sessions with a single pageview
  avgPagesPerSession: number;
  trend: { date: string; pageviews: number; visitors: number }[];
  topPages: { path: string; views: number }[];
  entryPages: { path: string; sessions: number }[];
  exitPages: { path: string; sessions: number }[];
  topSources: { source: string; views: number }[];
  devices: { device: string; views: number }[];
  countries: { country: string; views: number }[];
  conversions: { event: string; count: number }[];
  bookingFunnel: { pageviews: number; bookPage: number; submitted: number };
  recent: { time: string; event: string; path: string }[];
};

const n = (v: unknown) => Number(v ?? 0);
const s = (v: unknown) => String(v ?? "");

/**
 * Fetch the full dashboard snapshot for the given range (in days), in parallel.
 * Returns null if not configured or the core query fails.
 */
export async function getAnalyticsSnapshot(
  rangeDays: number = 7,
): Promise<AnalyticsSnapshot | null> {
  if (!analyticsConfigured()) return null;

  const d = Number.isFinite(rangeDays) && rangeDays > 0 ? Math.floor(rangeDays) : 7;
  const prev = d * 2;
  // Bucket the trend by day for short ranges, by week for the 90-day view so the
  // chart stays readable.
  const bucket = d > 45 ? "toStartOfWeek(timestamp)" : "toDate(timestamp)";
  const CONV = "('booking_submitted', 'contact_submitted', 'newsletter_subscribed')";
  // Exclude the owner's own admin browsing so the figures reflect real visitors.
  const NO_ADMIN = "properties.$pathname NOT ILIKE '/admin%'";

  const [
    kpis,
    kpisPrev,
    convNow,
    convPrev,
    trend,
    topPages,
    entryPages,
    exitPages,
    topSources,
    devices,
    countries,
    conversions,
    funnel,
    bounce,
    recent,
  ] = await Promise.all([
    // Current-period pageviews / visitors / sessions in one pass.
    hogql(
      `SELECT count(), count(distinct person_id), count(distinct properties.$session_id)
       FROM events WHERE event = '$pageview' AND ${NO_ADMIN} AND timestamp >= now() - INTERVAL ${d} DAY`,
    ),
    // Previous equal-length period, for deltas.
    hogql(
      `SELECT count(), count(distinct person_id), count(distinct properties.$session_id)
       FROM events WHERE event = '$pageview' AND ${NO_ADMIN}
         AND timestamp >= now() - INTERVAL ${prev} DAY AND timestamp < now() - INTERVAL ${d} DAY`,
    ),
    hogql(
      `SELECT count() FROM events WHERE event IN ${CONV} AND timestamp >= now() - INTERVAL ${d} DAY`,
    ),
    hogql(
      `SELECT count() FROM events WHERE event IN ${CONV}
         AND timestamp >= now() - INTERVAL ${prev} DAY AND timestamp < now() - INTERVAL ${d} DAY`,
    ),
    hogql(
      `SELECT ${bucket} AS d, count(), count(distinct person_id)
       FROM events WHERE event = '$pageview' AND ${NO_ADMIN} AND timestamp >= now() - INTERVAL ${d} DAY
       GROUP BY d ORDER BY d`,
    ),
    hogql(
      `SELECT properties.$pathname AS path, count() AS c
       FROM events WHERE event = '$pageview' AND ${NO_ADMIN} AND timestamp >= now() - INTERVAL ${d} DAY
       GROUP BY path ORDER BY c DESC LIMIT 10`,
    ),
    // Entry page = first pageview path of each session.
    hogql(
      `SELECT path, count() AS c FROM (
         SELECT properties.$session_id AS sid, argMin(properties.$pathname, timestamp) AS path
         FROM events WHERE event = '$pageview' AND ${NO_ADMIN} AND timestamp >= now() - INTERVAL ${d} DAY
           AND properties.$session_id IS NOT NULL
         GROUP BY sid
       ) GROUP BY path ORDER BY c DESC LIMIT 8`,
    ),
    // Exit page = last pageview path of each session.
    hogql(
      `SELECT path, count() AS c FROM (
         SELECT properties.$session_id AS sid, argMax(properties.$pathname, timestamp) AS path
         FROM events WHERE event = '$pageview' AND ${NO_ADMIN} AND timestamp >= now() - INTERVAL ${d} DAY
           AND properties.$session_id IS NOT NULL
         GROUP BY sid
       ) GROUP BY path ORDER BY c DESC LIMIT 8`,
    ),
    hogql(
      `SELECT coalesce(nullif(properties.$referring_domain, ''), '$direct') AS src, count() AS c
       FROM events WHERE event = '$pageview' AND ${NO_ADMIN} AND timestamp >= now() - INTERVAL ${d} DAY
       GROUP BY src ORDER BY c DESC LIMIT 8`,
    ),
    hogql(
      `SELECT coalesce(nullif(properties.$device_type, ''), 'Unknown') AS dv, count() AS c
       FROM events WHERE event = '$pageview' AND ${NO_ADMIN} AND timestamp >= now() - INTERVAL ${d} DAY
       GROUP BY dv ORDER BY c DESC`,
    ),
    hogql(
      `SELECT coalesce(nullif(properties.$geoip_country_name, ''), 'Unknown') AS c, count() AS nn
       FROM events WHERE event = '$pageview' AND ${NO_ADMIN} AND timestamp >= now() - INTERVAL ${d} DAY
       GROUP BY c ORDER BY nn DESC LIMIT 6`,
    ),
    hogql(
      `SELECT event, count() AS c FROM events WHERE event IN ${CONV}
         AND timestamp >= now() - INTERVAL ${d} DAY GROUP BY event ORDER BY c DESC`,
    ),
    hogql(
      `SELECT
         countIf(event = '$pageview' AND ${NO_ADMIN}),
         countIf(event = '$pageview' AND properties.$pathname = '/book'),
         countIf(event = 'booking_submitted')
       FROM events WHERE timestamp >= now() - INTERVAL ${d} DAY`,
    ),
    // Bounce: sessions with exactly one pageview / all sessions.
    hogql(
      `SELECT countIf(c = 1), count(), sum(c) FROM (
         SELECT properties.$session_id AS sid, count() AS c
         FROM events WHERE event = '$pageview' AND ${NO_ADMIN} AND timestamp >= now() - INTERVAL ${d} DAY
           AND properties.$session_id IS NOT NULL
         GROUP BY sid
       )`,
    ),
    hogql(
      `SELECT timestamp, event, coalesce(properties.$pathname, '') AS path
       FROM events WHERE NOT (event = '$pageview' AND properties.$pathname ILIKE '/admin%')
       ORDER BY timestamp DESC LIMIT 20`,
    ),
  ]);

  // If the core query failed (bad key / project), treat the whole thing as unavailable.
  if (kpis === null) return null;

  const bouncedSessions = n(bounce?.[0]?.[0]);
  const totalSessions = n(bounce?.[0]?.[1]);
  const totalPv = n(bounce?.[0]?.[2]);

  return {
    rangeDays: d,
    totals: {
      pageviews: n(kpis[0]?.[0]),
      visitors: n(kpis[0]?.[1]),
      sessions: n(kpis[0]?.[2]),
      conversions: n(convNow?.[0]?.[0]),
      pageviewsPrev: n(kpisPrev?.[0]?.[0]),
      visitorsPrev: n(kpisPrev?.[0]?.[1]),
      sessionsPrev: n(kpisPrev?.[0]?.[2]),
      conversionsPrev: n(convPrev?.[0]?.[0]),
    },
    bounceRate: totalSessions > 0 ? Math.round((bouncedSessions / totalSessions) * 100) : 0,
    avgPagesPerSession: totalSessions > 0 ? totalPv / totalSessions : 0,
    trend: (trend ?? []).map((r) => ({
      date: s(r[0]),
      pageviews: n(r[1]),
      visitors: n(r[2]),
    })),
    topPages: (topPages ?? []).map((r) => ({ path: s(r[0]) || "/", views: n(r[1]) })),
    entryPages: (entryPages ?? []).map((r) => ({ path: s(r[0]) || "/", sessions: n(r[1]) })),
    exitPages: (exitPages ?? []).map((r) => ({ path: s(r[0]) || "/", sessions: n(r[1]) })),
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
