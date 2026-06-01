import Link from "next/link";
import { ArrowRight, ArrowUpRight, Play, Star } from "lucide-react";
import {
  getActivityFeed,
  getClients,
  getProcessSteps,
  getProjects,
  getReviews,
  getServices,
  getSiteSettings,
} from "@/lib/cms";
import { ActivityFeedCard } from "@/components/site/activity-feed-card";
import { BentoTile } from "@/components/site/bento-tile";
import { HeroTicker } from "@/components/site/hero-ticker";
import { Reveal } from "@/components/site/reveal";
import { ServiceIcon } from "@/components/site/service-icon";

// Title + description inherit the site-wide defaults from the root layout; we
// only pin the canonical URL here so the homepage isn't deduped against any
// query-string variants.
export const metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [settings, services, projects, reviews, processSteps, activity, clients] =
    await Promise.all([
      getSiteSettings(),
      getServices({ featuredOnly: false }),
      getProjects({ featuredOnly: true, limit: 3 }),
      getReviews({ featuredOnly: true, limit: 4 }),
      getProcessSteps(),
      getActivityFeed(),
      getClients({ featuredOnly: true }),
    ]);

  const featuredProject = projects[0];
  const supportingProjects = projects.slice(1);
  const leadReview = reviews.find((r) => r.type === "text") ?? reviews[0];
  const videoReviews = reviews.filter((r) => r.type === "video").slice(0, 2);
  const otherTextReview = reviews.find(
    (r) => r.type === "text" && r.id !== leadReview?.id,
  );

  return (
    <>
      {/* ============================= HERO ============================= */}
      <section className="relative pt-16 pb-20 lg:pt-24 lg:pb-28 overflow-hidden">
        <div className="mesh" />
        <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />

        <div className="relative max-w-[1280px] mx-auto px-6 lg:px-10">
          <Reveal className="flex items-center gap-3 mb-8">
            <span className="badge badge-brand badge-dot badge-pulse">
              Booking {settings.booking_quarter} · {settings.booking_slots_open} slots open
            </span>
            <span className="t-mono text-muted hidden sm:inline">
              /{settings.city?.split(",")[0]?.toLowerCase()} · est. 2016
            </span>
          </Reveal>

          <Reveal delay={1}>
            <h1 className="t-display-xl max-w-[18ch]">
              Full-stack agency for teams that&nbsp;ship&nbsp;
              <HeroTicker words={settings.ticker_words} />
            </h1>
          </Reveal>

          <div className="grid lg:grid-cols-12 gap-10 mt-10 lg:mt-14 items-end">
            <Reveal delay={2} className="lg:col-span-7">
              <p className="t-body-l text-muted max-w-xl">{settings.hero_body}</p>
              <div className="flex flex-wrap items-center gap-3 mt-7">
                <Link
                  href={settings.hero_cta_href ?? "/book"}
                  className="btn btn-primary btn-lg btn-magnetic"
                >
                  <span className="flex items-center gap-2">
                    {settings.hero_cta_label ?? "Book a call"}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
                <Link href="/portfolio" className="btn btn-secondary btn-lg">
                  See the work
                </Link>
                <span className="t-small text-muted ml-2 hidden md:inline">
                  30 min · no slides · usually same week
                </span>
              </div>
            </Reveal>

            <Reveal delay={3} className="lg:col-span-5">
              <ActivityFeedCard items={activity} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================= CLIENT MARQUEE ============================= */}
      {clients.length > 0 ? (
      <section className="py-12 border-y border-border bg-surface/40">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="flex items-center gap-6 mb-6">
            <span className="mono-tag">Trusted by</span>
            <span className="hidden md:inline t-small text-muted">
              SMBs and startups across web, growth, and apps
            </span>
          </div>
          <div className="marquee">
            <div
              className="marquee-track items-center font-display text-[1.75rem] lg:text-[2.25rem] font-medium"
              style={{ color: "var(--color-muted)" }}
            >
              {[...clients, ...clients].map((c, i) => (
                <span key={`${c.id}-${i}`} className="flex items-center gap-12">
                  <span>{c.name}</span>
                  <span style={{ color: "var(--color-border-strong)" }}>/</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
      ) : null}

      {/* ============================= SERVICES BENTO ============================= */}
      <section id="services" className="py-24 lg:py-32 relative">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-12 gap-8 mb-12 items-end">
            <Reveal className="lg:col-span-7">
              <span className="mono-tag">01 / Services</span>
              <h2 className="t-display-l mt-5 font-display">
                Ten disciplines.
                <br />
                <span className="text-muted">One team.</span>
              </h2>
            </Reveal>
            <Reveal delay={1} className="lg:col-span-5">
              <p className="t-body-l text-muted">
                The reason agencies hand you off to a sub-contractor on day three is
                the reason we don&apos;t. Everything below ships under one roof, on one
                Slack channel, on one invoice.
              </p>
            </Reveal>
          </div>

          {/*
            grid-auto-flow: dense lets later tiles backfill empty cells the mixed
            tile sizes would otherwise leave (e.g. the xl tile spans 7 cols × 3 rows,
            and we want sm tiles to slot into the remaining 5×3 area without leaving
            a gap at the end of the grid).
          */}
          {/*
            On mobile/tablet, let each tile size to its content (no fixed row
            height — the xl tile has a lot of copy and would clip at 140px).
            On lg+, lock to 140px rows so the bento math works.
          */}
          <div
            className="grid grid-cols-12 gap-3 lg:auto-rows-[140px]"
            style={{ gridAutoFlow: "dense" }}
          >
            {services.map((service, idx) => {
              // Sizes are chosen so the 10 standard services tile a 12-col grid
              // cleanly: 1 xl (7×3) + 3 md (5×1, filling rows 1-3 cols 8-12)
              // + 2 lg (6×2, filling rows 4-5) + 4 sm (3×1, filling row 6).
              const sizeClass =
                service.tile_size === "xl"
                  ? "col-span-12 lg:col-span-7 lg:row-span-3"
                  : service.tile_size === "lg"
                    ? "col-span-12 sm:col-span-6 lg:col-span-6 lg:row-span-2"
                    : service.tile_size === "md"
                      ? "col-span-6 lg:col-span-5 lg:row-span-1"
                      : "col-span-6 lg:col-span-3 lg:row-span-1";
              return (
                <BentoTile
                  key={service.id}
                  href={`/services/${service.slug}`}
                  className={`${sizeClass} p-6 lg:p-7 flex flex-col justify-between`}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`badge ${
                        service.tile_size === "xl" || service.featured
                          ? "badge-brand badge-dot"
                          : ""
                      }`}
                    >
                      {String(idx + 1).padStart(2, "0")}
                      {service.tile_size === "xl" ? " · Most picked" : ""}
                    </span>
                    <ArrowUpRight className="w-5 h-5 text-muted group-hover:text-fg group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition" />
                  </div>
                  <div>
                    {/* sm tiles are only 188px wide — the mono-tag duplicates info
                        that's already in the heading. Skip it to leave more room
                        for the icon + title. */}
                    {service.tile_size !== "sm" ? (
                      <span
                        className="mono-tag"
                        style={{ color: "var(--color-muted)" }}
                      >
                        {service.short_title ?? service.title}
                      </span>
                    ) : null}
                    {service.icon ? (
                      <div className="mt-3 mb-1 text-fg/80">
                        <ServiceIcon name={service.icon} className="w-5 h-5" />
                      </div>
                    ) : null}
                    <h3
                      className={`font-display mt-2 max-w-md ${
                        service.tile_size === "xl"
                          ? "t-heading-xl"
                          : "t-heading-l"
                      }`}
                    >
                      {/* sm tiles get the short_title (fits in 188px width).
                          xl/lg/md show the hero_snippet (longer marketing line). */}
                      {service.tile_size === "sm"
                        ? (service.short_title ?? service.title)
                        : (service.hero_snippet ?? service.title)}
                    </h3>
                    {service.tile_size === "xl" || service.tile_size === "lg" ? (
                      <p className="t-small text-muted mt-3 max-w-md">
                        {service.summary}
                      </p>
                    ) : null}
                    {(service.tile_size === "lg" || service.tile_size === "md") &&
                    service.tags.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {service.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="badge font-mono text-[10px]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </BentoTile>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================= FEATURED WORK ============================= */}
      {featuredProject ? (
        <section id="work" className="py-24 lg:py-32">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <div className="grid lg:grid-cols-12 gap-8 mb-12 items-end">
              <Reveal className="lg:col-span-7">
                <span className="mono-tag">02 / Selected work</span>
                <h2 className="t-display-l mt-5 font-display">
                  Receipts.
                  <br />
                  <span className="text-muted">Not adjectives.</span>
                </h2>
              </Reveal>
              <Reveal delay={1} className="lg:col-span-5 flex lg:justify-end">
                <Link
                  href="/portfolio"
                  className="btn btn-secondary group inline-flex"
                >
                  All projects
                  <ArrowUpRight className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition" />
                </Link>
              </Reveal>
            </div>

            <div className="grid lg:grid-cols-12 gap-6">
              {/* Hero project card with mock dashboard */}
              <Reveal className="lg:col-span-8 surface-card overflow-hidden">
                <div className="p-7 lg:p-9 border-b border-border flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <span className="mono-tag">
                      {featuredProject.hero_eyebrow ?? "CASE STUDY"}
                    </span>
                    <h3 className="t-heading-xl font-display mt-3">
                      {featuredProject.title}
                    </h3>
                    <p className="t-body text-muted mt-3 max-w-xl">
                      {featuredProject.summary}
                    </p>
                  </div>
                  <Link
                    href={`/portfolio/${featuredProject.slug}`}
                    className="btn btn-primary"
                  >
                    Read the case study{" "}
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                {featuredProject.cover_url ? (
                  <div className="bg-bg/40 p-4 lg:p-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={featuredProject.cover_url}
                      alt={featuredProject.title}
                      className="w-full h-auto rounded-lg border border-border"
                    />
                  </div>
                ) : null}
                {featuredProject.metrics.length > 0 ? (
                  <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-border">
                    {featuredProject.metrics.slice(0, 4).map((m, i) => (
                      <div
                        key={i}
                        className={`p-6 ${
                          i > 0 ? "border-l border-border" : ""
                        }`}
                      >
                        <div className="font-display text-2xl tracking-tight">
                          {m.value}
                        </div>
                        <div className="t-mono text-muted text-[11px] mt-1 uppercase tracking-wider">
                          {m.label}
                        </div>
                        {m.context ? (
                          <div className="t-small text-muted mt-2">
                            {m.context}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </Reveal>

              <Reveal delay={1} className="lg:col-span-4 flex flex-col gap-6">
                {supportingProjects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/portfolio/${p.slug}`}
                    className="bento-tile p-6 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="mono-tag">{p.hero_eyebrow ?? "CASE STUDY"}</span>
                      <ArrowUpRight className="w-4 h-4 text-muted group-hover:text-fg transition" />
                    </div>
                    <h4 className="t-heading-l font-display mt-4">{p.title}</h4>
                    <p className="t-small text-muted mt-2">{p.summary}</p>
                    {p.metrics.length > 0 ? (
                      <div className="flex flex-wrap gap-3 mt-5 pt-5 border-t border-border">
                        {p.metrics.slice(0, 3).map((m, i) => (
                          <div key={i}>
                            <div className="font-display text-lg">{m.value}</div>
                            <div className="t-mono text-muted text-[10px] uppercase tracking-wider">
                              {m.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </Link>
                ))}
              </Reveal>
            </div>
          </div>
        </section>
      ) : null}

      {/* ============================= PROCESS ============================= */}
      {processSteps.length > 0 ? (
      <section id="process" className="py-24 lg:py-32 relative">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-12 gap-8 mb-16 items-end">
            <Reveal className="lg:col-span-7">
              <span className="mono-tag">03 / How we work</span>
              <h2 className="t-display-l mt-5 font-display">
                Daily commits.
                <br />
                <span className="text-muted">Weekly demos.</span>
              </h2>
            </Reveal>
            <Reveal delay={1} className="lg:col-span-5">
              <p className="t-body-l text-muted">
                Most agencies hide their process to keep you locked in. We publish ours
                because predictability is the deliverable.
              </p>
            </Reveal>
          </div>

          <div className="space-y-12 lg:space-y-20">
            {processSteps.map((step, i) => (
              <Reveal
                key={step.id}
                delay={(i % 3) + 1 === 4 ? 3 : ((i % 3) + 1) as 1 | 2 | 3}
                className="grid lg:grid-cols-12 gap-6 lg:gap-10 items-start"
              >
                <div className="lg:col-span-4">
                  <div className="step-num">{step.step_number}</div>
                  {step.duration ? (
                    <span className="mono-tag mt-2">{step.duration}</span>
                  ) : null}
                </div>
                <div className="lg:col-span-8 pt-6">
                  {step.phase_label ? (
                    <span className="mono-tag">{step.phase_label}</span>
                  ) : null}
                  <h3 className="t-heading-xl font-display mt-3">{step.title}</h3>
                  <p className="t-body-l text-muted mt-4 max-w-2xl">
                    {step.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      ) : null}

      {/* ============================= REVIEWS ============================= */}
      <section className="py-24 lg:py-32 relative overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-12 gap-8 mb-12 items-end">
            <Reveal className="lg:col-span-7">
              <span className="mono-tag">04 / What clients say</span>
              <h2 className="t-display-l mt-5 font-display">
                Don&apos;t take our
                <br />
                <span className="text-muted">word for it.</span>
              </h2>
            </Reveal>
            <Reveal delay={1} className="lg:col-span-5">
              <p className="t-body-l text-muted">
                Real Google reviews from the people we&apos;ve built for — on the
                work, the price, and how fast we get back to them.
              </p>
            </Reveal>
          </div>

          <div className="grid lg:grid-cols-12 gap-6">
            {/* Lead text quote */}
            {leadReview ? (
              <Reveal className="lg:col-span-7 surface-card p-8 lg:p-10">
                <Star className="w-6 h-6 text-brand-500 fill-brand-500" />
                <blockquote className="t-heading-l font-display mt-6">
                  {leadReview.quote ??
                    "The clearest scope, the cleanest delivery."}
                </blockquote>
                <div className="flex items-center gap-3 mt-8 pt-6 border-t border-border">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-bg font-semibold">
                    {leadReview.author_name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div>
                    <div className="t-small">
                      <span className="text-fg">{leadReview.author_name}</span>
                      {leadReview.author_role ? (
                        <span className="text-muted">
                          {" · "}
                          {leadReview.author_role}
                        </span>
                      ) : null}
                    </div>
                    {leadReview.author_company ? (
                      <div className="t-mono text-muted text-xs">
                        {leadReview.author_company}
                      </div>
                    ) : null}
                  </div>
                </div>
              </Reveal>
            ) : null}

            {/* Video reviews */}
            <Reveal delay={1} className="lg:col-span-5 grid grid-cols-1 gap-6">
              {videoReviews.map((v) => (
                <VideoReviewCard key={v.id} review={v} />
              ))}
            </Reveal>

            {/* Secondary text review */}
            {otherTextReview ? (
              <Reveal delay={2} className="lg:col-span-12 surface-card p-7">
                <div className="flex items-start gap-6 flex-wrap">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: otherTextReview.rating ?? 5 }).map(
                      (_, i) => (
                        <Star key={i} className="w-4 h-4 text-muted" />
                      ),
                    )}
                  </div>
                  <blockquote className="flex-1 t-body-l text-fg max-w-3xl">
                    {otherTextReview.quote}
                  </blockquote>
                  <div className="t-mono text-muted text-sm">
                    {otherTextReview.author_name} ·{" "}
                    {otherTextReview.author_company}
                  </div>
                </div>
              </Reveal>
            ) : null}
          </div>
        </div>
      </section>

      {/* ============================= STATS + BOOKING CTA ============================= */}
      <section id="book" className="py-24 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
        <div className="relative max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-12 gap-8 items-end">
            <Reveal className="lg:col-span-7">
              <span className="mono-tag">05 / Engage</span>
              <h2 className="t-display-l mt-5 font-display">
                {settings.cta_heading}
              </h2>
              <p className="t-body-l text-muted mt-6 max-w-xl">
                {settings.cta_subheading}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-8">
                <Link href="/book" className="btn btn-primary btn-lg btn-magnetic">
                  <span className="flex items-center gap-2">
                    Book a discovery call <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
                <Link href="/contact" className="btn btn-secondary btn-lg">
                  Send a brief
                </Link>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 t-small text-muted">
                {settings.cta_benefits.map((b) => (
                  <li key={b} className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-brand-500" /> {b}
                  </li>
                ))}
              </ul>
            </Reveal>

            {settings.stats.length > 0 ? (
            <Reveal delay={1} className="lg:col-span-5">
              <div className="surface-card p-7">
                <div className="grid grid-cols-2 gap-4">
                  {settings.stats.map((stat) => (
                    <div key={stat.label} className="border-l border-border pl-4">
                      <div className="font-display text-3xl tracking-tight">
                        {stat.value}
                        {stat.suffix ? (
                          <span className="text-muted">{stat.suffix}</span>
                        ) : null}
                      </div>
                      <div className="t-mono text-muted text-[11px] uppercase tracking-wider mt-1">
                        {stat.label}
                      </div>
                      {stat.context ? (
                        <div className="t-small text-muted mt-2">
                          {stat.context}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}

// ============================= INTERNAL MOCKS =============================

function VideoReviewCard({
  review,
}: {
  review: {
    id: string;
    author_name: string;
    author_role: string | null;
    author_company: string | null;
    duration: string | null;
    video_thumbnail_url: string | null;
  };
}) {
  return (
    <div className="surface-card overflow-hidden group">
      <div className="relative aspect-video bg-gradient-to-br from-surface-2 to-bg flex items-center justify-center">
        {/* Silhouette */}
        <svg
          viewBox="0 0 200 120"
          className="absolute inset-0 w-full h-full opacity-40"
          aria-hidden
        >
          <ellipse cx="100" cy="50" rx="22" ry="26" fill="oklch(0.25 0.005 258)" />
          <path
            d="M55 130 Q55 80 100 80 Q145 80 145 130 Z"
            fill="oklch(0.25 0.005 258)"
          />
        </svg>
        <div className="relative w-14 h-14 rounded-full bg-fg/95 group-hover:scale-105 transition flex items-center justify-center">
          <Play className="w-5 h-5 text-bg fill-bg" />
        </div>
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="t-mono text-[10px] text-fg/80 px-2 py-1 rounded bg-bg/60 backdrop-blur">
            <span className="text-brand-500">●</span> REC
          </span>
        </div>
        {review.duration ? (
          <div className="absolute bottom-3 right-3 t-mono text-[10px] text-fg/80 px-2 py-1 rounded bg-bg/60 backdrop-blur">
            {review.duration}
          </div>
        ) : null}
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2">
          <span className="badge badge-brand">VIDEO</span>
          <span className="t-mono text-muted text-xs">Client review</span>
        </div>
        <div className="t-small mt-3">
          <span className="text-fg">{review.author_name}</span>
          {review.author_role ? (
            <span className="text-muted">
              {" · "}
              {review.author_role}
            </span>
          ) : null}
        </div>
        {review.author_company ? (
          <div className="t-mono text-muted text-xs">
            {review.author_company}
          </div>
        ) : null}
      </div>
    </div>
  );
}
