import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { getProjects, getServices } from "@/lib/cms";
import { Reveal } from "@/components/site/reveal";
import { PortfolioFilters } from "@/components/site/portfolio-filters";
import { JsonLd, breadcrumb } from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/site";

// Rebuild from the CMS at most every 10 minutes (ISR), so content edits in
// the admin go live without a manual redeploy.
export const revalidate = 600;

const description =
  "Recent ships. Filter by discipline: design, dev, mobile, CRMs, AI, growth.";

export const metadata = {
  title: "Work",
  description,
  alternates: { canonical: "/portfolio" },
  openGraph: { title: "Work · Trellee", description, url: "/portfolio" },
  twitter: { title: "Work · Trellee", description },
};

export default async function PortfolioPage() {
  const [projects, services] = await Promise.all([
    getProjects(),
    getServices(),
  ]);

  // Only show filter chips for disciplines that actually have case studies,
  // so there are no dead-end filters.
  const usedCats = new Set(projects.flatMap((p) => p.service_categories));
  const visibleServices = services.filter((s) => usedCats.has(s.slug));

  const crumbs = breadcrumb(SITE_URL, [
    { name: "Home", path: "/" },
    { name: "Work", path: "/portfolio" },
  ]);

  return (
    <>
      <JsonLd data={crumbs} />
      <section className="relative pt-16 pb-12 lg:pt-24 lg:pb-16 overflow-hidden">
        <div className="mesh" />
        <div className="relative max-w-[1280px] mx-auto px-6 lg:px-10">
          <Reveal>
            <span className="mono-tag">Work</span>
            <h1 className="t-display-xl mt-5 max-w-[18ch] font-display">
              Recent ships.
              <br />
              <span className="text-muted">Receipts attached.</span>
            </h1>
            <p className="t-body-l text-muted mt-6 max-w-2xl">
              A representative sample of projects across the past two years. Filter by
              discipline. Click in for the metrics, stack, and what we&apos;d do
              differently.
            </p>
          </Reveal>
        </div>
      </section>

      <PortfolioFilters services={visibleServices} />

      <section className="py-16 lg:py-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          {projects.length === 0 ? (
            <p className="t-body text-muted">
              No projects match this filter yet. Check back soon.
            </p>
          ) : (
            <>
            <div id="portfolio-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((p, i) => {
                return (
                  <Link
                    key={p.id}
                    href={`/portfolio/${p.slug}`}
                    data-cats={p.service_categories.join(" ")}
                    className="bento-tile p-0 overflow-hidden group flex flex-col min-h-[340px]"
                  >
                    <div className="relative overflow-hidden border-b border-border bg-surface-2 aspect-[16/10]">
                      {p.cover_url ? (
                        <Image
                          src={p.cover_url}
                          alt={`${p.title} website`}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          priority={i < 3}
                          className="object-cover object-top transition duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-surface-2 to-bg flex items-center justify-center">
                          <span className="font-display text-2xl text-muted/40 tracking-tight px-6 text-center">
                            {p.title}
                          </span>
                        </div>
                      )}
                      <ArrowUpRight className="absolute top-4 right-4 w-7 h-7 text-fg bg-bg/50 backdrop-blur rounded-md p-1 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition" />
                    </div>
                    <div className="p-7 flex-1 flex flex-col">
                    <div className="flex items-start justify-between">
                      <span className="mono-tag">
                        {p.hero_eyebrow ?? "CASE STUDY"}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-display t-heading-l">
                        {p.title}
                      </h3>
                      {p.client_name ? (
                        <div className="t-mono text-muted text-xs mt-2">
                          {p.client_name}
                        </div>
                      ) : null}
                      <p className="t-small text-muted mt-3 line-clamp-3 max-w-2xl">
                        {p.summary}
                      </p>
                      {p.metrics.length > 0 ? (
                        <div className="flex flex-wrap gap-6 mt-5 pt-5 border-t border-border">
                          {p.metrics.slice(0, 2).map((m, idx) => (
                            <div key={idx}>
                              <div className="font-display text-xl tracking-tight">
                                {m.value}
                              </div>
                              <div className="t-mono text-muted text-[10px] uppercase tracking-wider mt-0.5">
                                {m.label}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {p.service_categories.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 mt-4">
                          {p.service_categories.slice(0, 3).map((cat) => (
                            <span
                              key={cat}
                              className="badge font-mono text-[10px]"
                            >
                              {cat.replace(/-/g, " ")}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            <p
              id="portfolio-empty"
              className="t-body text-muted"
              style={{ display: "none" }}
            >
              No projects match this filter.
            </p>
            </>
          )}
        </div>
      </section>

      <section className="py-24 lg:py-32 relative overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="surface-card p-10 lg:p-14 text-center">
            <span className="mono-tag justify-center">Engage</span>
            <h2 className="t-display-l mt-5 font-display">Want to be next?</h2>
            <p className="t-body-l text-muted mt-5 max-w-xl mx-auto">
              We open 4-6 slots a quarter. If something below feels like your shape of
              problem, let&apos;s talk.
            </p>
            <Link href="/book" className="btn btn-primary btn-lg mt-8 inline-flex">
              Book a discovery call
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
