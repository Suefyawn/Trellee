import Link from "next/link";
import {
  Activity,
  PlayCircle,
  GitBranch,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowDownRight,
  Lightbulb,
} from "lucide-react";
import { AdminPageBody, AdminPageHeader } from "@/components/admin/admin-page";
import {
  getAnalyticsSnapshot,
  analyticsConfigured,
  analyticsEnvStatus,
  RANGES,
  normalizeRange,
} from "@/lib/posthog-server";
import { loadGsc, gscEnvStatus } from "@/lib/gsc-server";
import { googleOAuthStatus } from "@/lib/google-oauth";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

function posthogAppHost() {
  const h = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
  return h.includes("eu") ? "https://eu.posthog.com" : "https://us.posthog.com";
}
const SENTRY_ORG = "trellee-vx";
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

const CONVERSION_LABEL: Record<string, string> = {
  booking_submitted: "Call bookings",
  contact_submitted: "Contact briefs",
  newsletter_subscribed: "Newsletter signups",
};

const RANGE_LABEL: Record<number, string> = {
  7: "7 days",
  30: "30 days",
  90: "90 days",
};

/* ----------------------------- small pieces ----------------------------- */

function Delta({
  cur,
  prev,
  invert = false,
}: {
  cur: number;
  prev: number;
  invert?: boolean;
}) {
  if (prev <= 0) {
    return cur > 0 ? (
      <span className="t-mono text-[11px] text-brand-500">▲ new</span>
    ) : (
      <span className="t-mono text-[11px] text-muted">—</span>
    );
  }
  const diff = cur - prev;
  const p = Math.round((Math.abs(diff) / prev) * 100);
  const up = diff >= 0;
  const good = invert ? !up : up;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={`t-mono text-[11px] inline-flex items-center gap-1 ${
        good ? "text-brand-500" : "text-danger"
      }`}
    >
      <Icon className="w-3 h-3" />
      {p}%
    </span>
  );
}

function StatCard({
  label,
  display,
  cur,
  prev,
  invert = false,
  periodLabel,
}: {
  label: string;
  display: string;
  cur: number;
  prev: number;
  invert?: boolean;
  periodLabel: string;
}) {
  return (
    <div className="surface-card p-5">
      <div className="t-mono text-muted text-[11px] uppercase tracking-wider">
        {label}
      </div>
      <div className="font-display text-3xl tracking-tight mt-2">{display}</div>
      <div className="mt-1.5 flex items-center gap-1.5">
        <Delta cur={cur} prev={prev} invert={invert} />
        <span className="t-mono text-muted text-[10px]">vs prev {periodLabel}</span>
      </div>
    </div>
  );
}

function BarList({
  rows,
  emptyLabel = "No data yet.",
}: {
  rows: { label: string; value: number }[];
  emptyLabel?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0)
    return <p className="t-small text-muted p-1">{emptyLabel}</p>;
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label} className="relative">
          <div
            className="absolute inset-y-0 left-0 rounded bg-brand-500/12"
            style={{ width: `${(r.value / max) * 100}%` }}
          />
          <div className="relative flex items-center justify-between px-2 py-1.5">
            <span className="t-small text-fg truncate pr-3">{r.label}</span>
            <span className="t-mono text-muted text-xs shrink-0">{r.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Panel({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="surface-card p-5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="mono-tag">{title}</span>
        {hint ? <span className="t-mono text-muted text-[10px]">{hint}</span> : null}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

/** SVG area chart: pageviews area + visitors line. Scales to container width. */
function TrendChart({
  data,
}: {
  data: { date: string; pageviews: number; visitors: number }[];
}) {
  if (data.length === 0)
    return <p className="t-small text-muted p-1">No pageviews in this window yet.</p>;

  const W = 920;
  const H = 200;
  const PAD = 6;
  const max = Math.max(1, ...data.map((d) => d.pageviews));
  const lastIdx = Math.max(1, data.length - 1);
  const x = (i: number) => PAD + (i / lastIdx) * (W - 2 * PAD);
  const y = (v: number) => H - PAD - (v / max) * (H - 2 * PAD - 14);

  const pvLine = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.pageviews).toFixed(1)}`)
    .join(" ");
  const pvArea = `${pvLine} L${x(lastIdx).toFixed(1)},${H - PAD} L${x(0).toFixed(1)},${H - PAD} Z`;
  const visLine = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.visitors).toFixed(1)}`)
    .join(" ");

  const ticks = [0, Math.floor(lastIdx / 2), lastIdx];

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-48"
        preserveAspectRatio="none"
        role="img"
        aria-label="Pageviews and visitors trend"
      >
        <defs>
          <linearGradient id="pvfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* horizontal gridlines */}
        {[0.25, 0.5, 0.75].map((g) => (
          <line
            key={g}
            x1={PAD}
            x2={W - PAD}
            y1={y(max * g)}
            y2={y(max * g)}
            stroke="var(--color-border)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <path d={pvArea} fill="url(#pvfill)" />
        <path
          d={pvLine}
          fill="none"
          stroke="var(--color-brand-500)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={visLine}
          fill="none"
          stroke="var(--color-fg)"
          strokeOpacity="0.45"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="flex justify-between mt-2">
        {ticks.map((t) => (
          <span key={t} className="t-mono text-muted text-[10px]">
            {data[t]?.date.slice(5)}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-2">
        <span className="t-mono text-muted text-[10px] inline-flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-brand-500 inline-block" /> Pageviews
        </span>
        <span className="t-mono text-muted text-[10px] inline-flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-fg/45 inline-block" /> Visitors
        </span>
        <span className="t-mono text-muted text-[10px] ml-auto">peak {max}/period</span>
      </div>
    </div>
  );
}

function RangeTabs({ current }: { current: number }) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-surface-2/40 p-0.5">
      {RANGES.map((r) => (
        <Link
          key={r}
          href={`?range=${r}`}
          scroll={false}
          className={`px-3 py-1.5 rounded-md t-mono text-xs transition ${
            current === r
              ? "bg-brand-500 text-bg"
              : "text-muted hover:text-fg"
          }`}
        >
          {r}d
        </Link>
      ))}
    </div>
  );
}

/* -------------------------------- page --------------------------------- */

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; gsc?: string }>;
}) {
  const ph = posthogAppHost();
  const sp = await searchParams;
  const range = normalizeRange(sp.range);
  const gscNotice = sp.gsc;
  const [data, gscResult, oauth] = await Promise.all([
    getAnalyticsSnapshot(range),
    loadGsc(28),
    googleOAuthStatus(),
  ]);
  const gsc = gscResult.snapshot;
  const gscError = gscResult.error;
  const periodLabel = RANGE_LABEL[range] ?? `${range} days`;
  const gscRedirectUri = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin/analytics/google/callback`;

  const links = [
    { label: "Web analytics", href: `${ph}/web`, icon: Activity },
    { label: "Session replay", href: `${ph}/replay`, icon: PlayCircle },
    { label: "Paths & funnels", href: `${ph}/insights`, icon: GitBranch },
    {
      label: "Error tracking (Sentry)",
      href: `https://${SENTRY_ORG}.sentry.io/issues/`,
      icon: AlertTriangle,
    },
  ];

  // Derived figures + insight bullets (only built when data is present).
  const insights: string[] = [];
  if (data) {
    const t = data.totals;
    if (t.pageviewsPrev > 0) {
      const diff = pct(Math.abs(t.pageviews - t.pageviewsPrev), t.pageviewsPrev);
      insights.push(
        `Pageviews are ${t.pageviews >= t.pageviewsPrev ? "up" : "down"} ${diff}% versus the previous ${periodLabel}.`,
      );
    }
    if (data.topSources[0]) {
      insights.push(
        `${data.topSources[0].source} is your top traffic source (${data.topSources[0].views} views).`,
      );
    }
    if (data.bookingFunnel.bookPage > 0) {
      insights.push(
        `${pct(data.bookingFunnel.submitted, data.bookingFunnel.bookPage)}% of people who reach /book actually book a call.`,
      );
    } else if (data.bookingFunnel.pageviews > 0) {
      insights.push(
        `No one reached /book in this window — the booking page may need a more visible path.`,
      );
    }
    insights.push(
      `Bounce rate is ${data.bounceRate}% (${
        data.bounceRate <= 40 ? "healthy" : data.bounceRate <= 60 ? "average" : "high — review entry pages"
      }).`,
    );
    if (data.exitPages[0]) {
      insights.push(
        `Most sessions end on ${data.exitPages[0].path} — a good place to add a next step or CTA.`,
      );
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Analytics"
        description="Live traffic, journeys, and conversions from PostHog. Reload for the latest."
      />
      <AdminPageBody>
        {!analyticsConfigured() ? (
          <div className="rounded-lg border border-warning/40 bg-warning/5 p-6 mb-6">
            <h3 className="t-heading-l font-display">Connect the dashboard</h3>
            <p className="t-body text-muted mt-2 max-w-2xl">
              PostHog is already capturing pageviews, journeys, clicks, and the
              conversion events. To show the numbers here, add a read key:
            </p>
            <ol className="mt-4 space-y-1.5 t-small text-muted list-decimal pl-5 max-w-2xl">
              <li>
                PostHog → Settings → <span className="text-fg">Personal API keys</span> →
                create one with read scope.
              </li>
              <li>
                In Vercel, set{" "}
                <span className="t-mono text-fg">POSTHOG_PERSONAL_API_KEY</span> and{" "}
                <span className="t-mono text-fg">POSTHOG_PROJECT_ID</span> (PostHog →
                Settings → Project ID) for the{" "}
                <span className="text-fg">Production</span> environment, then redeploy.
              </li>
            </ol>
            {(() => {
              const st = analyticsEnvStatus();
              return (
                <div className="mt-5 pt-4 border-t border-border/60">
                  <div className="t-mono text-muted text-[11px] uppercase tracking-wider mb-2">
                    What this server currently sees
                  </div>
                  <ul className="space-y-1 t-small">
                    <li className={st.key ? "text-brand-500" : "text-danger"}>
                      {st.key ? "✓" : "✗"} POSTHOG_PERSONAL_API_KEY
                      {st.key ? ` (starts "${st.keyPrefix}…")` : " — not detected"}
                    </li>
                    <li className={st.project ? "text-brand-500" : "text-danger"}>
                      {st.project ? "✓" : "✗"} POSTHOG_PROJECT_ID
                      {st.project ? ` = ${st.projectId}` : " — not detected"}
                    </li>
                    <li className="text-muted">host: {st.host}</li>
                  </ul>
                </div>
              );
            })()}
          </div>
        ) : data === null ? (
          <div className="rounded-lg border border-danger/40 bg-danger/5 p-6 mb-6">
            <p className="t-body text-muted">
              Couldn&apos;t reach PostHog. Double-check{" "}
              <span className="t-mono">POSTHOG_PERSONAL_API_KEY</span> (read scope) and{" "}
              <span className="t-mono">POSTHOG_PROJECT_ID</span>.
            </p>
          </div>
        ) : (
          <>
            {/* Range selector */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="t-mono text-muted text-xs uppercase tracking-wider">
                Last {periodLabel}
              </span>
              <RangeTabs current={range} />
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                label={`Visitors · ${range}d`}
                display={data.totals.visitors.toLocaleString()}
                cur={data.totals.visitors}
                prev={data.totals.visitorsPrev}
                periodLabel={periodLabel}
              />
              <StatCard
                label={`Pageviews · ${range}d`}
                display={data.totals.pageviews.toLocaleString()}
                cur={data.totals.pageviews}
                prev={data.totals.pageviewsPrev}
                periodLabel={periodLabel}
              />
              <StatCard
                label={`Sessions · ${range}d`}
                display={data.totals.sessions.toLocaleString()}
                cur={data.totals.sessions}
                prev={data.totals.sessionsPrev}
                periodLabel={periodLabel}
              />
              <StatCard
                label={`Conversions · ${range}d`}
                display={data.totals.conversions.toLocaleString()}
                cur={data.totals.conversions}
                prev={data.totals.conversionsPrev}
                periodLabel={periodLabel}
              />
            </div>

            {/* Secondary metric strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
              <div className="surface-card p-4">
                <div className="t-mono text-muted text-[11px] uppercase tracking-wider">
                  Bounce rate
                </div>
                <div className="font-display text-2xl mt-1">{data.bounceRate}%</div>
              </div>
              <div className="surface-card p-4">
                <div className="t-mono text-muted text-[11px] uppercase tracking-wider">
                  Pages / session
                </div>
                <div className="font-display text-2xl mt-1">
                  {data.avgPagesPerSession.toFixed(1)}
                </div>
              </div>
              <div className="surface-card p-4">
                <div className="t-mono text-muted text-[11px] uppercase tracking-wider">
                  Book-page → booked
                </div>
                <div className="font-display text-2xl mt-1">
                  {pct(data.bookingFunnel.submitted, data.bookingFunnel.bookPage)}%
                </div>
              </div>
              <div className="surface-card p-4">
                <div className="t-mono text-muted text-[11px] uppercase tracking-wider">
                  Visit → conversion
                </div>
                <div className="font-display text-2xl mt-1">
                  {pct(data.totals.conversions, data.totals.sessions)}%
                </div>
              </div>
            </div>

            {/* Trend */}
            <div className="surface-card p-5 mt-3">
              <div className="flex items-baseline justify-between">
                <span className="mono-tag">Traffic trend</span>
                <span className="t-mono text-muted text-[10px]">
                  {data.rangeDays > 45 ? "weekly" : "daily"} · last {periodLabel}
                </span>
              </div>
              <div className="mt-4">
                <TrendChart data={data.trend} />
              </div>
            </div>

            {/* Insights */}
            {insights.length > 0 ? (
              <div className="surface-card p-5 mt-3">
                <span className="mono-tag inline-flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-brand-500" /> What stands out
                </span>
                <ul className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-2">
                  {insights.map((t, i) => (
                    <li key={i} className="t-small text-muted flex gap-2">
                      <span className="text-brand-500 shrink-0">•</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Booking funnel with drop-off */}
            <div className="surface-card p-5 mt-3">
              <span className="mono-tag">Booking funnel · {periodLabel}</span>
              <div className="mt-4 space-y-2.5">
                {(() => {
                  const f = data.bookingFunnel;
                  const steps = [
                    { label: "All pageviews", value: f.pageviews },
                    { label: "Viewed /book", value: f.bookPage },
                    { label: "Booked a call", value: f.submitted },
                  ];
                  const top = Math.max(1, f.pageviews);
                  return steps.map((step, i) => {
                    const prevVal = i === 0 ? step.value : steps[i - 1].value;
                    const stepRate = i === 0 ? 100 : pct(step.value, prevVal);
                    return (
                      <div key={step.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="t-small text-fg">{step.label}</span>
                          <span className="t-mono text-muted text-xs">
                            {step.value.toLocaleString()}
                            {i > 0 ? (
                              <span className="ml-2 inline-flex items-center gap-0.5 text-muted">
                                <ArrowDownRight className="w-3 h-3" />
                                {stepRate}%
                              </span>
                            ) : null}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-brand-500/70"
                            style={{ width: `${Math.max(1.5, (step.value / top) * 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Acquisition */}
            <div className="grid lg:grid-cols-2 gap-3 mt-3">
              <Panel title="Top sources" hint={periodLabel}>
                <BarList
                  rows={data.topSources.map((p) => ({ label: p.source, value: p.views }))}
                />
              </Panel>
              <Panel title="Top pages" hint={periodLabel}>
                <BarList
                  rows={data.topPages.map((p) => ({ label: p.path, value: p.views }))}
                />
              </Panel>
            </div>

            {/* Journey */}
            <div className="grid lg:grid-cols-2 gap-3 mt-3">
              <Panel title="Entry pages" hint="where sessions start">
                <BarList
                  rows={data.entryPages.map((p) => ({ label: p.path, value: p.sessions }))}
                  emptyLabel="Not enough session data yet."
                />
              </Panel>
              <Panel title="Exit pages" hint="where sessions end">
                <BarList
                  rows={data.exitPages.map((p) => ({ label: p.path, value: p.sessions }))}
                  emptyLabel="Not enough session data yet."
                />
              </Panel>
            </div>

            {/* Audience */}
            <div className="grid lg:grid-cols-2 gap-3 mt-3">
              <Panel title="Devices" hint={periodLabel}>
                <BarList
                  rows={data.devices.map((d) => ({ label: d.device, value: d.views }))}
                />
              </Panel>
              <Panel title="Countries" hint={periodLabel}>
                <BarList
                  rows={data.countries.map((c) => ({ label: c.country, value: c.views }))}
                />
              </Panel>
            </div>

            {/* Conversions + live */}
            <div className="grid lg:grid-cols-2 gap-3 mt-3">
              <Panel title="Conversions" hint={periodLabel}>
                <BarList
                  rows={data.conversions.map((c) => ({
                    label: CONVERSION_LABEL[c.event] ?? c.event,
                    value: c.count,
                  }))}
                  emptyLabel="No conversions yet — they'll appear as visitors book, contact, or subscribe."
                />
              </Panel>
              <Panel title="Live activity" hint="latest events">
                {data.recent.length === 0 ? (
                  <p className="t-small text-muted p-1">No recent events.</p>
                ) : (
                  <ul className="space-y-2">
                    {data.recent.slice(0, 12).map((e, i) => (
                      <li key={i} className="flex items-center gap-2 t-small">
                        <span className="t-mono text-muted text-[10px] w-14 shrink-0">
                          {timeAgo(e.time)}
                        </span>
                        <span className="text-fg truncate">
                          {e.event === "$pageview" ? "viewed" : e.event}
                        </span>
                        <span className="t-mono text-muted text-xs truncate">{e.path}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>
          </>
        )}

        {/* Search Console — independent of PostHog; shows a connect card until
            the service account + verified domain are configured. */}
        <div className="mt-6">
          <div className="flex items-baseline justify-between mb-3">
            <span className="t-mono text-muted text-xs uppercase tracking-wider">
              Search · Google Search Console
            </span>
            {gsc ? (
              <span className="t-mono text-muted text-[10px]">
                last {gsc.rangeDays} days
              </span>
            ) : null}
          </div>
          {gsc ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "Clicks", value: gsc.totals.clicks.toLocaleString() },
                  {
                    label: "Impressions",
                    value: gsc.totals.impressions.toLocaleString(),
                  },
                  { label: "Avg CTR", value: `${(gsc.totals.ctr * 100).toFixed(1)}%` },
                  { label: "Avg position", value: gsc.totals.position.toFixed(1) },
                ].map((s) => (
                  <div key={s.label} className="surface-card p-4">
                    <div className="t-mono text-muted text-[11px] uppercase tracking-wider">
                      {s.label}
                    </div>
                    <div className="font-display text-2xl mt-1">{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="grid lg:grid-cols-2 gap-3 mt-3">
                <Panel title="Top search queries" hint="clicks · avg position">
                  {gsc.topQueries.length === 0 ? (
                    <p className="t-small text-muted p-1">No query data yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {gsc.topQueries.map((q) => (
                        <li
                          key={q.query}
                          className="flex items-center justify-between gap-3 t-small"
                        >
                          <span className="text-fg truncate">{q.query}</span>
                          <span className="t-mono text-muted text-xs shrink-0">
                            {q.clicks} · #{q.position.toFixed(0)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>
                <Panel title="Top landing pages" hint="clicks">
                  <BarList
                    rows={gsc.topPages.map((p) => ({
                      label: p.page.replace(/^https?:\/\/[^/]+/, "") || "/",
                      value: p.clicks,
                    }))}
                    emptyLabel="No page data yet."
                  />
                </Panel>
              </div>
            </>
          ) : (
            (() => {
              const st = gscEnvStatus();
              const NOTICE: Record<string, { ok: boolean; text: string }> = {
                connected: {
                  ok: true,
                  text: "Google account connected. Search data appears here within a day (Google has a ~2-day reporting lag).",
                },
                denied: { ok: false, text: "Connection cancelled — you didn't grant access." },
                state_mismatch: { ok: false, text: "Security check failed — please try connecting again." },
                exchange_failed: {
                  ok: false,
                  text: "Google didn't return a usable token. Remove the app at myaccount.google.com/permissions and reconnect.",
                },
                oauth_unconfigured: {
                  ok: false,
                  text: "Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET first.",
                },
              };
              const notice = gscNotice ? NOTICE[gscNotice] : undefined;
              return (
                <div className="rounded-lg border border-border bg-surface-2/30 p-6">
                  <h3 className="t-heading-l font-display">
                    {gscError ? "Search Console: needs attention" : "Connect Search Console"}
                  </h3>
                  {notice ? (
                    <div
                      className={`mt-3 rounded-md border p-3 ${
                        notice.ok
                          ? "border-brand-500/40 bg-brand-500/5"
                          : "border-danger/40 bg-danger/5"
                      }`}
                    >
                      <p className="t-small text-fg">{notice.text}</p>
                    </div>
                  ) : null}
                  {gscError ? (
                    <div className="mt-3 rounded-md border border-danger/40 bg-danger/5 p-3">
                      <p className="t-small text-fg">{gscError}</p>
                    </div>
                  ) : null}
                  <p className="t-body text-muted mt-3 max-w-2xl">
                    See the real Google searches that bring people in — queries,
                    impressions, clicks, and average position.
                  </p>

                  {/* Primary path: one-click OAuth with your own Google account */}
                  <div className="mt-5">
                    {oauth.clientConfigured ? (
                      oauth.connected ? (
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="t-small text-brand-500">
                            ✓ Connected{oauth.email ? ` as ${oauth.email}` : ""}
                          </span>
                          <a href="/admin/analytics/google/connect" className="btn btn-ghost btn-sm">
                            Reconnect
                          </a>
                          <span className="t-small text-muted">
                            {gscError
                              ? "Connected, but this account can't read the property above — make sure it has access to it in Search Console."
                              : "Search data will populate shortly."}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <a href="/admin/analytics/google/connect" className="btn btn-primary">
                            Connect Google account
                          </a>
                          <p className="t-small text-muted mt-2 max-w-2xl">
                            One-time sign-in with your own Google account (read-only Search
                            Console). No service-account user grant needed — the account just
                            has to have access to the{" "}
                            <span className="t-mono">{st.site || "GSC_SITE_URL"}</span> property.
                          </p>
                        </div>
                      )
                    ) : (
                      <div className="rounded-md border border-border/60 p-3">
                        <p className="t-small text-muted max-w-2xl">
                          To enable one-click connect, create an{" "}
                          <span className="text-fg">OAuth 2.0 Web client</span> in Google Cloud
                          with redirect URI{" "}
                          <span className="t-mono text-fg break-all">{gscRedirectUri}</span>, then
                          set <span className="t-mono text-fg">GOOGLE_OAUTH_CLIENT_ID</span> and{" "}
                          <span className="t-mono text-fg">GOOGLE_OAUTH_CLIENT_SECRET</span> in
                          Vercel and redeploy. A “Connect Google account” button will appear here.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Diagnostic */}
                  <div className="mt-5 pt-4 border-t border-border/60">
                    <div className="t-mono text-muted text-[11px] uppercase tracking-wider mb-2">
                      What this server currently sees
                    </div>
                    <ul className="space-y-1 t-small">
                      <li className={oauth.clientConfigured ? "text-brand-500" : "text-muted"}>
                        {oauth.clientConfigured ? "✓" : "○"} OAuth client (GOOGLE_OAUTH_CLIENT_ID
                        /SECRET){oauth.connected ? " · connected" : ""}
                      </li>
                      <li className={st.site ? "text-brand-500" : "text-danger"}>
                        {st.site ? "✓" : "✗"} GSC_SITE_URL
                        {st.site ? ` = ${st.site}` : " — not detected"}
                      </li>
                      <li className={st.account ? "text-brand-500" : "text-muted"}>
                        {st.account ? "✓" : "○"} GSC_SERVICE_ACCOUNT_JSON (optional fallback)
                        {st.serviceEmail ? ` · ${st.serviceEmail}` : ""}
                      </li>
                    </ul>
                  </div>
                </div>
              );
            })()
          )}
        </div>

        {/* Deep links — always available */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
          {links.map((l) => {
            const Icon = l.icon;
            return (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="surface-card p-4 group hover:border-border-strong transition flex items-center gap-3"
              >
                <Icon className="w-4 h-4 text-brand-500 shrink-0" />
                <span className="t-small text-fg flex-1">{l.label}</span>
                <span className="t-mono text-muted text-xs group-hover:text-fg transition">
                  ↗
                </span>
              </a>
            );
          })}
        </div>

        <p className="t-small text-muted mt-4">
          Deeper analysis (session replays, custom funnels, paths) lives in PostHog;
          Google Search Console + GA4 can be linked next for search-query and
          channel data.
        </p>
      </AdminPageBody>
    </>
  );
}
