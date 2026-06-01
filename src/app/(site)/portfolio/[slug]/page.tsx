import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight, Star } from "lucide-react";
import {
  getProjectBySlug,
  getProjects,
  getReviews,
} from "@/lib/cms";
import { Reveal } from "@/components/site/reveal";

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return {};
  return {
    title: project.meta_title ?? project.title,
    description: project.meta_description ?? project.summary,
    alternates: { canonical: `/portfolio/${slug}` },
  };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const [reviews, related] = await Promise.all([
    getReviews({ projectId: project.id, limit: 1 }),
    getProjects({ limit: 3 }),
  ]);
  const review = reviews[0];
  const relatedProjects = related.filter((p) => p.id !== project.id).slice(0, 2);

  // Group tech by category
  const techByCategory = project.technologies.reduce<Record<string, string[]>>(
    (acc, t) => {
      const cat = t.category ?? "Stack";
      (acc[cat] ||= []).push(t.name);
      return acc;
    },
    {},
  );

  return (
    <>
      {/* HERO */}
      <section className="relative pt-16 pb-20 lg:pt-24 lg:pb-28 overflow-hidden">
        <div className="mesh" />
        <div className="relative max-w-[1280px] mx-auto px-6 lg:px-10">
          <Reveal>
            <Link
              href="/portfolio"
              className="t-mono text-muted hover:text-fg transition inline-flex items-center gap-2"
            >
              ← All work
            </Link>
          </Reveal>

          <div className="mt-8 lg:mt-12 max-w-3xl">
            <Reveal>
              <span className="mono-tag">{project.hero_eyebrow ?? "CASE STUDY"}</span>
              <h1 className="t-display-xl mt-5 font-display">{project.title}</h1>
              {project.client_name ? (
                <p className="t-body-l text-muted mt-4">{project.client_name}</p>
              ) : null}
              <p className="t-body-l text-muted mt-6">{project.summary}</p>
            </Reveal>
          </div>

          {project.metrics.length > 0 ? (
            <Reveal
              delay={1}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12 lg:mt-16"
            >
              {project.metrics.slice(0, 4).map((m, i) => (
                <div key={i} className="surface-card p-6">
                  <div className="font-display text-3xl tracking-tight">
                    {m.value}
                  </div>
                  <div className="t-mono text-muted text-[10px] uppercase tracking-wider mt-2">
                    {m.label}
                  </div>
                  {m.context ? (
                    <div className="t-small text-muted mt-2">{m.context}</div>
                  ) : null}
                </div>
              ))}
            </Reveal>
          ) : null}
        </div>
      </section>

      {/* COVER — the live site's hero, shown as the lead visual */}
      {project.cover_url ? (
        <section className="pb-8 lg:pb-12">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <Reveal className="surface-card overflow-hidden aspect-[16/10] md:aspect-[16/9] relative">
              <Image
                src={project.cover_url}
                alt={`${project.title} website`}
                fill
                sizes="(max-width: 1280px) 100vw, 1200px"
                priority
                className="object-cover object-top"
              />
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* GALLERY — only renders when project.gallery has entries. Empty galleries
          would just show four blank boxes, which looks worse than skipping the section. */}
      {project.gallery.length > 0 ? (
        <section className="pb-16 lg:pb-24">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <Reveal className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.gallery.map((item, i) => (
                <figure
                  key={i}
                  className="surface-card overflow-hidden"
                >
                  {item.url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={item.url}
                      alt={item.caption ?? `${project.title} image ${i + 1}`}
                      className="w-full h-auto"
                    />
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-surface-2 to-bg" />
                  )}
                  {item.caption ? (
                    <figcaption className="px-5 py-3 t-mono text-muted text-xs border-t border-border">
                      {item.caption}
                    </figcaption>
                  ) : null}
                </figure>
              ))}
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* THE BRIEF */}
      {project.brief ? (
        <section className="py-24 lg:py-32">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10 grid lg:grid-cols-12 gap-10">
            <Reveal className="lg:col-span-4">
              <span className="mono-tag">01 / The brief</span>
            </Reveal>
            <Reveal delay={1} className="lg:col-span-8">
              <p className="t-body-l whitespace-pre-wrap">{project.brief}</p>
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* THE APPROACH */}
      {project.approach ? (
        <section className="py-24 lg:py-32">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10 grid lg:grid-cols-12 gap-10">
            <Reveal className="lg:col-span-4">
              <span className="mono-tag">02 / The approach</span>
            </Reveal>
            <Reveal delay={1} className="lg:col-span-8">
              <p className="t-body-l whitespace-pre-wrap">{project.approach}</p>
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* RESULTS */}
      {project.outcome ? (
        <section className="py-24 lg:py-32 relative overflow-hidden">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10 grid lg:grid-cols-12 gap-10">
            <Reveal className="lg:col-span-4">
              <span className="mono-tag">03 / The result</span>
            </Reveal>
            <Reveal delay={1} className="lg:col-span-8">
              <p className="t-body-l whitespace-pre-wrap">{project.outcome}</p>
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* TECH STACK */}
      {project.technologies.length > 0 ? (
        <section className="py-24 lg:py-32">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <Reveal className="mb-10">
              <span className="mono-tag">04 / Stack</span>
              <h2 className="t-display-l mt-5 font-display">What we built it with.</h2>
            </Reveal>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(techByCategory).map(([cat, names]) => (
                <div key={cat} className="surface-card p-6">
                  <span className="mono-tag">{cat}</span>
                  <ul className="mt-4 space-y-2">
                    {names.map((n) => (
                      <li key={n} className="t-body text-fg">
                        {n}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* TESTIMONIAL */}
      {review ? (
        <section className="py-24 lg:py-32">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <Reveal className="surface-card p-10 lg:p-14 max-w-4xl mx-auto">
              <Star className="w-6 h-6 text-brand-500 fill-brand-500" />
              <blockquote className="t-heading-xl font-display mt-6">
                {review.quote ?? "We&apos;d work with Trellee on the next one."}
              </blockquote>
              <div className="flex items-center gap-3 mt-8 pt-6 border-t border-border">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-bg font-semibold">
                  {review.author_name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div>
                  <div className="t-small text-fg">{review.author_name}</div>
                  <div className="t-mono text-muted text-xs">
                    {[review.author_role, review.author_company]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* RELATED */}
      {relatedProjects.length > 0 ? (
        <section className="py-24 lg:py-32">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <Reveal className="mb-10">
              <span className="mono-tag">More work</span>
              <h2 className="t-heading-xl mt-5 font-display">Other recent ships.</h2>
            </Reveal>
            <div className="grid md:grid-cols-2 gap-4">
              {relatedProjects.map((p) => (
                <Link
                  key={p.id}
                  href={`/portfolio/${p.slug}`}
                  className="bento-tile p-7 group flex flex-col justify-between min-h-[260px]"
                >
                  <div className="flex items-start justify-between">
                    <span className="mono-tag">{p.hero_eyebrow ?? "CASE STUDY"}</span>
                    <ArrowUpRight className="w-5 h-5 text-muted group-hover:text-fg group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition" />
                  </div>
                  <div>
                    <h3 className="t-heading-l font-display">{p.title}</h3>
                    <p className="t-small text-muted mt-2">{p.summary}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* CTA */}
      <section className="py-24 lg:py-32 relative overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="surface-card p-10 lg:p-14 text-center relative overflow-hidden">
            <div className="mesh opacity-50" />
            <div className="relative">
              <span className="mono-tag justify-center">Engage</span>
              <h2 className="t-display-l mt-5 font-display">
                Want a similar outcome?
              </h2>
              <Link
                href="/book"
                className="btn btn-primary btn-lg mt-8 inline-flex btn-magnetic"
              >
                <span className="flex items-center gap-2">
                  Book a discovery call <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
