import { BarChart3, Activity, PlayCircle, GitBranch, AlertTriangle } from "lucide-react";
import { AdminPageBody, AdminPageHeader } from "@/components/admin/admin-page";

export const dynamic = "force-dynamic";

// PostHog app host derived from the ingest host (us.i.posthog.com -> us.posthog.com).
function posthogAppHost() {
  const h = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
  return h.includes("eu") ? "https://eu.posthog.com" : "https://us.posthog.com";
}

const SENTRY_ORG = "trellee-vx";

export default function AdminAnalyticsPage() {
  const ph = posthogAppHost();
  const phEnabled = !!process.env.NEXT_PUBLIC_POSTHOG_KEY;

  const links = [
    {
      label: "Web analytics",
      desc: "Traffic, top pages, referrers, and devices.",
      href: `${ph}/web`,
      icon: Activity,
    },
    {
      label: "Session replay",
      desc: "Watch real visitor sessions, click by click.",
      href: `${ph}/replay`,
      icon: PlayCircle,
    },
    {
      label: "Paths & funnels",
      desc: "User journeys and conversion funnels (book a call, contact, newsletter).",
      href: `${ph}/insights`,
      icon: GitBranch,
    },
    {
      label: "Error tracking (Sentry)",
      desc: "Exceptions, performance, and replays.",
      href: `https://${SENTRY_ORG}.sentry.io/issues/`,
      icon: AlertTriangle,
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Analytics"
        description="Live product analytics and error tracking live in PostHog and Sentry. Jump straight to the views that matter."
      />
      <AdminPageBody>
        {!phEnabled ? (
          <div className="rounded-lg border border-warning/40 bg-warning/5 p-5 mb-6">
            <p className="t-body text-muted">
              PostHog isn&apos;t configured yet. Set{" "}
              <span className="t-mono">NEXT_PUBLIC_POSTHOG_KEY</span> in Vercel to
              start capturing pageviews, journeys, and the conversion events
              (newsletter, contact, booking).
            </p>
          </div>
        ) : null}

        <div className="grid sm:grid-cols-2 gap-4">
          {links.map((l) => {
            const Icon = l.icon;
            return (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="surface-card p-6 group hover:border-border-strong transition flex items-start gap-4"
              >
                <span className="w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-brand-500" />
                </span>
                <div>
                  <div className="t-heading-l font-display flex items-center gap-2">
                    {l.label}
                    <span className="t-mono text-muted text-xs group-hover:text-fg transition">
                      ↗
                    </span>
                  </div>
                  <p className="t-small text-muted mt-1">{l.desc}</p>
                </div>
              </a>
            );
          })}
        </div>

        <div className="surface-card p-6 mt-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-muted" />
            <span className="mono-tag">Tracked conversions</span>
          </div>
          <p className="t-small text-muted mt-3 max-w-2xl">
            Beyond pageviews, the site fires named events you can build funnels on:{" "}
            <span className="t-mono text-fg">booking_submitted</span>,{" "}
            <span className="t-mono text-fg">contact_submitted</span>, and{" "}
            <span className="t-mono text-fg">newsletter_subscribed</span>. In PostHog,
            create a funnel from <span className="text-fg">pageview → book → booking_submitted</span>{" "}
            to see drop-off.
          </p>
        </div>
      </AdminPageBody>
    </>
  );
}
