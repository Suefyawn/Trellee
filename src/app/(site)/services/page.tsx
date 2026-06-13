import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getServices } from "@/lib/cms";
import { Reveal } from "@/components/site/reveal";
import { ServiceIcon } from "@/components/site/service-icon";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/site";

// Rebuild from the CMS at most every 10 minutes (ISR), so content edits in
// the admin go live without a manual redeploy.
export const revalidate = 600;

export const metadata = {
  title: "Services",
  description:
    "Ten disciplines, one team. Brand, web, mobile, CRMs, AI, SEO, ads, lead gen, marketing, scraping.",
  alternates: { canonical: "/services" },
};

export default async function ServicesPage() {
  const services = await getServices();

  // Group by category for the section split
  const grouped = services.reduce<Record<string, typeof services>>((acc, s) => {
    const key = s.category ?? "Other";
    (acc[key] ||= []).push(s);
    return acc;
  }, {});
  const categories = Object.keys(grouped);

  const siteUrl = SITE_URL;
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Trellee services",
    itemListElement: services.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Service",
        name: s.title,
        ...(s.summary ? { description: s.summary } : {}),
        url: `${siteUrl}/services/${s.slug}`,
        provider: { "@type": "Organization", name: "Trellee", url: siteUrl },
      },
    })),
  };

  return (
    <>
      <JsonLd data={itemList} />
      <section className="relative pt-16 pb-12 lg:pt-24 lg:pb-16 overflow-hidden">
        <div className="mesh" />
        <div className="relative max-w-[1280px] mx-auto px-6 lg:px-10">
          <Reveal>
            <span className="mono-tag">Services</span>
            <h1 className="t-display-xl mt-5 max-w-[18ch] font-display">
              Ten disciplines.
              <br />
              <span className="text-muted">One team. One invoice.</span>
            </h1>
            <p className="t-body-l text-muted mt-6 max-w-2xl">
              We don&apos;t hand you off to a sub-contractor on day three. Everything below
              ships under one roof, on one Slack channel, on one invoice.
            </p>
          </Reveal>
        </div>
      </section>

      {categories.map((cat, ci) => (
        <section key={cat} className="py-16 lg:py-20">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <Reveal className="flex items-end justify-between mb-8">
              <span className="mono-tag">
                {String(ci + 1).padStart(2, "0")} / {cat}
              </span>
              <span className="t-mono text-muted">
                {grouped[cat].length} service{grouped[cat].length === 1 ? "" : "s"}
              </span>
            </Reveal>
            {/* Grid columns adapt to category size: 1 service spans the full
                row (no awkward empty space on the right); 2 services use a
                2-col grid; 3+ use the standard 3-col grid. */}
            <div
              className={
                grouped[cat].length === 1
                  ? "grid grid-cols-1 gap-4"
                  : grouped[cat].length === 2
                    ? "grid md:grid-cols-2 gap-4"
                    : "grid md:grid-cols-2 lg:grid-cols-3 gap-4"
              }
            >
              {grouped[cat].map((s) => {
                const isSolo = grouped[cat].length === 1;
                return (
                  <Link
                    key={s.id}
                    href={`/services/${s.slug}`}
                    className={
                      isSolo
                        ? "bento-tile p-8 lg:p-10 group flex flex-col md:flex-row gap-8 md:items-center min-h-[260px]"
                        : "bento-tile p-7 group flex flex-col justify-between min-h-[260px]"
                    }
                  >
                    {isSolo ? (
                      /* Side-by-side layout when this category has only one
                         service — gives the lone card more presence. */
                      <>
                        <div className="md:w-2/5 flex md:flex-col items-start justify-between md:justify-start gap-4">
                          <ServiceIcon
                            name={s.icon}
                            className="w-7 h-7 text-fg/80"
                          />
                          <span
                            className="mono-tag"
                            style={{ color: "var(--color-muted)" }}
                          >
                            {s.short_title ?? s.title}
                          </span>
                        </div>
                        <div className="md:w-3/5 flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <h3 className="t-heading-xl font-display">{s.title}</h3>
                            <ArrowUpRight className="w-6 h-6 text-muted group-hover:text-fg group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition shrink-0" />
                          </div>
                          <p className="t-body text-muted mt-4 max-w-xl">
                            {s.summary ?? s.hero_snippet}
                          </p>
                          {s.tags.length > 0 ? (
                            <div className="mt-5 flex flex-wrap gap-1.5">
                              {s.tags.slice(0, 6).map((tag) => (
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
                      </>
                    ) : (
                      <>
                        <div className="flex items-start justify-between">
                          <ServiceIcon
                            name={s.icon}
                            className="w-5 h-5 text-fg/80"
                          />
                          <ArrowUpRight className="w-5 h-5 text-muted group-hover:text-fg group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition" />
                        </div>
                        <div>
                          <span
                            className="mono-tag"
                            style={{ color: "var(--color-muted)" }}
                          >
                            {s.short_title ?? s.title}
                          </span>
                          <h3 className="t-heading-l font-display mt-2">
                            {s.title}
                          </h3>
                          <p className="t-small text-muted mt-3 line-clamp-3">
                            {s.summary ?? s.hero_snippet}
                          </p>
                          {s.tags.length > 0 ? (
                            <div className="mt-4 flex flex-wrap gap-1.5">
                              {s.tags.slice(0, 3).map((tag) => (
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
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      ))}

      <section className="py-24 lg:py-32">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="surface-card p-10 lg:p-14 text-center">
            <span className="mono-tag justify-center">Engage</span>
            <h2 className="t-display-l mt-5 font-display">
              Don&apos;t see your discipline?
            </h2>
            <p className="t-body-l text-muted mt-5 max-w-xl mx-auto">
              We say no twice a week. If we don&apos;t do it well in-house, we&apos;ll tell you
              who does.
            </p>
            <Link href="/book" className="btn btn-primary btn-lg mt-8 inline-flex">
              <span className="flex items-center gap-2">
                Talk to us <ArrowUpRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
