import {
  Activity,
  PlayCircle,
  GitBranch,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { AdminPageBody, AdminPageHeader } from "@/components/admin/admin-page";
import { getAnalyticsSnapshot, analyticsConfigured } from "@/lib/posthog-server";
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
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="surface-card p-5">
      <span className="mono-tag">{title}</span>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default async function AdminAnalyticsPage() {
  const ph = posthogAppHost();
  const data = await getAnalyticsSnapshot();

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

  const pvChange = data ? data.pageviews7d - data.pageviewsPrev7d : 0;
  const pvChangePct = data ? pct(pvChange < 0 ? -pvChange : pvChange, data.pageviewsPrev7d) : 0;
  const totalConversions = data
    ? data.conversions.reduce((a, c) => a + c.count, 0)
    : 0;
  const trendMax = data ? Math.max(1, ...data.trend.map((d) => d.pageviews)) : 1;

  return (
    <>
      <AdminPageHeader
        title="Analytics"
        description="Live traffic, journeys, and conversions, pulled from PostHog. Reload for the latest."
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
                Settings → Project ID), then redeploy.
              </li>
            </ol>
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
            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="surface-card p-5">
                <div className="t-mono text-muted text-[11px] uppercase tracking-wider">
                  Visitors · 7d
                </div>
                <div className="font-display text-3xl tracking-tight mt-2">
                  {data.visitors7d.toLocaleString()}
                </div>
              </div>
              <div className="surface-card p-5">
                <div className="t-mono text-muted text-[11px] uppercase tracking-wider">
                  Pageviews · 7d
                </div>
                <div className="font-display text-3xl tracking-tight mt-2">
                  {data.pageviews7d.toLocaleString()}
                </div>
                {data.pageviewsPrev7d > 0 ? (
                  <div
                    className={`t-mono text-xs mt-1 flex items-center gap-1 ${
                      pvChange >= 0 ? "text-brand-500" : "text-danger"
                    }`}
                  >
                    {pvChange >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {pvChangePct}% vs prev 7d
                  </div>
                ) : null}
              </div>
              <div className="surface-card p-5">
                <div className="t-mono text-muted text-[11px] uppercase tracking-wider">
                  Conversions · 30d
                </div>
                <div className="font-display text-3xl tracking-tight mt-2">
                  {totalConversions.toLocaleString()}
                </div>
              </div>
              <div className="surface-card p-5">
                <div className="t-mono text-muted text-[11px] uppercase tracking-wider">
                  Book-page → booked
                </div>
                <div className="font-display text-3xl tracking-tight mt-2">
                  {pct(data.bookingFunnel.submitted, data.bookingFunnel.bookPage)}%
                </div>
              </div>
            </div>

            {/* Trend */}
            <div className="surface-card p-5 mt-3">
              <span className="mono-tag">Pageviews · last 14 days</span>
              <div className="mt-5 flex items-end gap-1.5 h-32">
                {data.trend.map((d) => (
                  <div
                    key={d.date}
                    className="flex-1 flex flex-col items-center justify-end h-full group"
                    title={`${d.date}: ${d.pageviews} views · ${d.visitors} visitors`}
                  >
                    <div
                      className="w-full rounded-t bg-brand-500/70 group-hover:bg-brand-500 transition"
                      style={{ height: `${Math.max(2, (d.pageviews / trendMax) * 100)}%` }}
                    />
                    <span className="t-mono text-muted text-[9px] mt-1.5">
                      {d.date.slice(5)}
                    </span>
                  </div>
                ))}
                {data.trend.length === 0 ? (
                  <p className="t-small text-muted">No pageviews yet.</p>
                ) : null}
              </div>
            </div>

            {/* Booking funnel */}
            <div className="surface-card p-5 mt-3">
              <span className="mono-tag">Booking funnel · 30d</span>
              <div className="grid sm:grid-cols-3 gap-3 mt-4">
                {[
                  { label: "All pageviews", value: data.bookingFunnel.pageviews, sub: "" },
                  {
                    label: "Viewed /book",
                    value: data.bookingFunnel.bookPage,
                    sub: `${pct(data.bookingFunnel.bookPage, data.bookingFunnel.pageviews)}% of visits`,
                  },
                  {
                    label: "Booked a call",
                    value: data.bookingFunnel.submitted,
                    sub: `${pct(data.bookingFunnel.submitted, data.bookingFunnel.bookPage)}% of /book`,
                  },
                ].map((step) => (
                  <div key={step.label} className="rounded-lg bg-surface-2/50 p-4">
                    <div className="font-display text-2xl">{step.value.toLocaleString()}</div>
                    <div className="t-small text-fg mt-1">{step.label}</div>
                    {step.sub ? (
                      <div className="t-mono text-muted text-[11px] mt-1">{step.sub}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            {/* Two-up panels */}
            <div className="grid lg:grid-cols-2 gap-3 mt-3">
              <Panel title="Top pages · 7d">
                <BarList rows={data.topPages.map((p) => ({ label: p.path, value: p.views }))} />
              </Panel>
              <Panel title="Top sources · 7d">
                <BarList rows={data.topSources.map((p) => ({ label: p.source, value: p.views }))} />
              </Panel>
              <Panel title="Devices · 7d">
                <BarList rows={data.devices.map((d) => ({ label: d.device, value: d.views }))} />
              </Panel>
              <Panel title="Countries · 7d">
                <BarList rows={data.countries.map((c) => ({ label: c.country, value: c.views }))} />
              </Panel>
              <Panel title="Conversions · 30d">
                <BarList
                  rows={data.conversions.map((c) => ({
                    label: CONVERSION_LABEL[c.event] ?? c.event,
                    value: c.count,
                  }))}
                  emptyLabel="No conversions yet — they'll appear as visitors book, contact, or subscribe."
                />
              </Panel>
              <Panel title="Live activity">
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
