import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getProjects, getServices } from "@/lib/cms";
import { Reveal } from "@/components/site/reveal";
import { PortfolioFilters } from "@/components/site/portfolio-filters";

export const metadata = {
  title: "Work",
  description:
    "Recent ships. Filter by discipline — design, dev, mobile, CRMs, AI, growth.",
};

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const [projects, services] = await Promise.all([
    getProjects({ service: params.category }),
    getServices(),
  ]);

  return (
    <>
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

      <PortfolioFilters services={services} active={params.category} />

      <section className="py-16 lg:py-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          {projects.length === 0 ? (
            <p className="t-body text-muted">
              No projects match this filter yet — check back soon.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((p, i) => {
                const isFeature = i === 0;
                return (
                  <Link
                    key={p.id}
                    href={`/portfolio/${p.slug}`}
                    className={`bento-tile p-7 group flex flex-col justify-between min-h-[340px] ${
                      isFeature
                        ? "md:col-span-2 lg:col-span-2 lg:row-span-2 lg:min-h-[700px]"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="mono-tag">
                        {p.hero_eyebrow ?? "CASE STUDY"}
                      </span>
                      <ArrowUpRight className="w-5 h-5 text-muted group-hover:text-fg group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition" />
                    </div>
                    <div>
                      <h3
                        className={`font-display ${
                          isFeature ? "t-heading-xl" : "t-heading-l"
                        }`}
                      >
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
                          {p.metrics.slice(0, isFeature ? 4 : 2).map((m, idx) => (
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
                  </Link>
                );
              })}
            </div>
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
