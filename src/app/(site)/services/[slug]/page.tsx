import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import {
  getFAQs,
  getPricingTiersForService,
  getProcessSteps,
  getProjects,
  getServiceBySlug,
  getServices,
} from "@/lib/cms";
import { Reveal } from "@/components/site/reveal";
import { ServiceIcon } from "@/components/site/service-icon";
import { FAQAccordion } from "@/components/site/faq-accordion";
import { JsonLd, breadcrumb } from "@/components/seo/json-ld";

// Rebuild from the CMS at most every 10 minutes (ISR), so content edits in
// the admin go live without a manual redeploy.
export const revalidate = 600;

export async function generateStaticParams() {
  const services = await getServices();
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) return {};
  return {
    title: service.meta_title ?? service.title,
    description: service.meta_description ?? service.hero_snippet,
    alternates: { canonical: `/services/${slug}` },
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  const [pricingTiers, faqs, processSteps, relatedProjects] = await Promise.all([
    getPricingTiersForService(service.id),
    getFAQs({ category: slug }),
    getProcessSteps({ serviceId: service.id }),
    getProjects({ service: slug, limit: 1 }),
  ]);

  const featuredProject = relatedProjects[0];

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://trellee.vercel.app";
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    ...(service.summary || service.hero_snippet
      ? { description: service.summary ?? service.hero_snippet }
      : {}),
    ...(service.category ? { serviceType: service.category } : {}),
    provider: { "@type": "Organization", name: "Trellee", url: siteUrl },
    url: `${siteUrl}/services/${slug}`,
  };
  const faqSchema =
    faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        }
      : null;

  const crumbs = breadcrumb(siteUrl, [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: service.title, path: `/services/${slug}` },
  ]);

  return (
    <>
      <JsonLd
        data={faqSchema ? [serviceSchema, faqSchema, crumbs] : [serviceSchema, crumbs]}
      />
      {/* HERO */}
      <section className="relative pt-16 pb-20 lg:pt-24 lg:pb-28 overflow-hidden">
        <div className="mesh" />
        <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />

        <div className="relative max-w-[1280px] mx-auto px-6 lg:px-10">
          <Reveal>
            <Link
              href="/services"
              className="t-mono text-muted hover:text-fg transition inline-flex items-center gap-2"
            >
              ← All services
            </Link>
          </Reveal>

          <div className="grid lg:grid-cols-12 gap-10 mt-8 lg:mt-12 items-end">
            <Reveal className="lg:col-span-7">
              <div className="flex items-center gap-3">
                <ServiceIcon name={service.icon} className="w-6 h-6 text-brand-500" />
                <span className="mono-tag">{service.category ?? "Service"}</span>
              </div>
              <h1 className="t-display-l mt-5 font-display">{service.title}</h1>
              <p className="t-body-l text-muted mt-6 max-w-2xl">
                {service.hero_snippet}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-7">
                <Link
                  href={`/book?service=${service.slug}`}
                  className="btn btn-primary btn-lg btn-magnetic"
                >
                  <span className="flex items-center gap-2">
                    Book a discovery call <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
                <Link href="/contact" className="btn btn-secondary btn-lg">
                  Send a brief
                </Link>
              </div>
              {service.tags.length > 0 ? (
                <div className="mt-7 flex flex-wrap gap-1.5">
                  {service.tags.map((tag) => (
                    <span key={tag} className="badge font-mono">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </Reveal>

            {service.hero_code ? (
              <Reveal delay={1} className="lg:col-span-5">
                <div className="code-window">
                  <div className="code-bar">
                    <span
                      className="code-dot"
                      style={{ background: "oklch(0.50 0.010 258)" }}
                    />
                    <span
                      className="code-dot"
                      style={{ background: "oklch(0.40 0.010 258)" }}
                    />
                    <span
                      className="code-dot"
                      style={{ background: "oklch(0.30 0.010 258)" }}
                    />
                    <span className="t-mono text-muted ml-2 text-[11px]">
                      {service.slug}/{service.hero_code_lang === "typescript" ? "schema.ts" : "snippet"}
                    </span>
                  </div>
                  <div className="code-body">
                    <pre className="whitespace-pre-wrap break-words">
                      <code>{service.hero_code}</code>
                    </pre>
                  </div>
                </div>
              </Reveal>
            ) : null}
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      {service.problem_statement ? (
        <section className="py-24 lg:py-32">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <div className="grid lg:grid-cols-12 gap-10">
              <Reveal className="lg:col-span-5">
                <span className="mono-tag">01 / The problem</span>
                <h2 className="t-heading-xl mt-5 font-display">
                  Off-the-shelf isn&apos;t built for you.
                </h2>
              </Reveal>
              <Reveal delay={1} className="lg:col-span-7">
                <p className="t-body-l text-muted">{service.problem_statement}</p>
              </Reveal>
            </div>
          </div>
        </section>
      ) : null}

      {/* APPROACH PILLARS */}
      {service.approach_pillars?.length > 0 ? (
        <section className="py-24 lg:py-32">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <Reveal className="mb-12">
              <span className="mono-tag">02 / Our approach</span>
              <h2 className="t-display-l mt-5 font-display">
                Three principles.
                <br />
                <span className="text-muted">No exceptions.</span>
              </h2>
            </Reveal>
            <div className="grid lg:grid-cols-3 gap-4">
              {service.approach_pillars.map((pillar, i) => (
                <Reveal
                  key={pillar.title}
                  delay={(i + 1) as 1 | 2 | 3}
                  className="surface-card p-8"
                >
                  <span className="step-num" style={{ fontSize: "3.5rem" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="t-heading-l font-display mt-4">{pillar.title}</h3>
                  <p className="t-body text-muted mt-3">{pillar.description}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* PROCESS */}
      {processSteps.length > 0 ? (
        <section className="py-24 lg:py-32">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <Reveal className="mb-16">
              <span className="mono-tag">03 / Process</span>
              <h2 className="t-display-l mt-5 font-display">
                Five steps.
                <br />
                <span className="text-muted">Predictable in writing.</span>
              </h2>
            </Reveal>
            <div className="space-y-12 lg:space-y-20">
              {processSteps.map((step) => (
                <Reveal
                  key={step.id}
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

      {/* DELIVERABLES */}
      {service.deliverables?.length > 0 ? (
        <section className="py-24 lg:py-32">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <Reveal className="mb-12">
              <span className="mono-tag">04 / Deliverables</span>
              <h2 className="t-display-l mt-5 font-display">
                What you get.
                <br />
                <span className="text-muted">In writing, by week one.</span>
              </h2>
            </Reveal>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {service.deliverables.map((d, i) => (
                <Reveal
                  key={d.title}
                  delay={((i % 3) + 1) as 1 | 2 | 3}
                  className="surface-card p-6"
                >
                  <Check className="w-5 h-5 text-brand-500" />
                  <h3 className="t-heading-l font-display mt-4">{d.title}</h3>
                  <p className="t-small text-muted mt-2">{d.description}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* PRICING */}
      {pricingTiers.length > 0 ? (
        <section id="pricing" className="py-24 lg:py-32">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <Reveal className="mb-12">
              <span className="mono-tag">05 / Pricing</span>
              <h2 className="t-display-l mt-5 font-display">
                Fixed-fee, fixed-scope.
                <br />
                <span className="text-muted">No surprises.</span>
              </h2>
            </Reveal>
            <div className="grid lg:grid-cols-3 gap-4">
              {pricingTiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`surface-card p-8 flex flex-col ${
                    tier.highlighted
                      ? "border-brand-500/40 bg-brand-500/[0.04]"
                      : ""
                  }`}
                >
                  {tier.highlighted ? (
                    <span className="badge badge-brand badge-dot self-start">
                      Most picked
                    </span>
                  ) : null}
                  <h3 className="t-heading-l font-display mt-4">{tier.name}</h3>
                  <div className="flex items-baseline gap-1 mt-4">
                    <span className="font-display text-5xl tracking-tight">
                      {tier.price}
                    </span>
                    {tier.price_suffix ? (
                      <span className="t-mono text-muted">{tier.price_suffix}</span>
                    ) : null}
                  </div>
                  <p className="t-body text-muted mt-3">{tier.description}</p>
                  <ul className="mt-6 space-y-2.5 flex-1">
                    {tier.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 t-small text-fg"
                      >
                        <Check className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={tier.cta_href}
                    className={`btn ${
                      tier.highlighted ? "btn-brand" : "btn-secondary"
                    } mt-6`}
                  >
                    {tier.cta_label}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* FAQS */}
      {faqs.length > 0 ? (
        <section className="py-24 lg:py-32">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <Reveal className="mb-12">
              <span className="mono-tag">06 / Questions</span>
              <h2 className="t-display-l mt-5 font-display">
                The honest answers.
              </h2>
            </Reveal>
            <FAQAccordion items={faqs} />
          </div>
        </section>
      ) : null}

      {/* RELATED CASE STUDY */}
      {featuredProject ? (
        <section className="py-24 lg:py-32">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <Reveal className="mb-8">
              <span className="mono-tag">07 / Receipts</span>
              <h2 className="t-display-l mt-5 font-display">A recent ship.</h2>
            </Reveal>
            <Link
              href={`/portfolio/${featuredProject.slug}`}
              className="surface-card p-8 lg:p-12 block group hover:border-border-strong transition"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="max-w-2xl">
                  <span className="mono-tag">{featuredProject.hero_eyebrow}</span>
                  <h3 className="t-heading-xl font-display mt-3">
                    {featuredProject.title}
                  </h3>
                  <p className="t-body text-muted mt-3">{featuredProject.summary}</p>
                </div>
                <ArrowUpRight className="w-6 h-6 text-muted group-hover:text-fg group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition flex-shrink-0" />
              </div>
              {featuredProject.metrics.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-8 border-t border-border">
                  {featuredProject.metrics.slice(0, 4).map((m, i) => (
                    <div key={i}>
                      <div className="font-display text-2xl tracking-tight">
                        {m.value}
                      </div>
                      <div className="t-mono text-muted text-[10px] uppercase tracking-wider mt-1">
                        {m.label}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </Link>
          </div>
        </section>
      ) : null}

      {/* CTA */}
      <section className="py-24 lg:py-32">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="surface-card p-10 lg:p-14 text-center relative overflow-hidden">
            <div className="mesh opacity-50" />
            <div className="relative">
              <span className="mono-tag justify-center">Engage</span>
              <h2 className="t-display-l mt-5 font-display">
                Ready to start?
              </h2>
              <p className="t-body-l text-muted mt-5 max-w-xl mx-auto">
                30-minute discovery call. No deck, no sales script. Bring the problem
                and we&apos;ll bring the questions.
              </p>
              <Link
                href={`/book?service=${service.slug}`}
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
