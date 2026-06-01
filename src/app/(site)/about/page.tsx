import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  getSiteSettings,
  getTeamMembers,
  getValues,
} from "@/lib/cms";
import { Reveal } from "@/components/site/reveal";
import { ServiceIcon } from "@/components/site/service-icon";

export const metadata = {
  title: "About",
  description: "Who we are, why we built Trellee, and how we work.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const [settings, values, team] = await Promise.all([
    getSiteSettings(),
    getValues(),
    getTeamMembers(),
  ]);

  return (
    <>
      <section className="relative pt-16 pb-20 lg:pt-24 lg:pb-28 overflow-hidden">
        <div className="mesh" />
        <div className="relative max-w-[1280px] mx-auto px-6 lg:px-10">
          <Reveal>
            <span className="mono-tag">About</span>
            <h1 className="t-display-xl mt-5 max-w-[20ch] font-display">
              {settings.about_hero_headline ??
                "We build the systems your business runs on."}
            </h1>
            <p className="t-body-l text-muted mt-6 max-w-2xl">
              {settings.about_hero_subheadline}
            </p>
          </Reveal>
        </div>
      </section>

      {settings.about_origin_story ? (
        <section className="py-24 lg:py-32">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10 grid lg:grid-cols-12 gap-10">
            <Reveal className="lg:col-span-4">
              <span className="mono-tag">01 / Origin</span>
            </Reveal>
            <Reveal delay={1} className="lg:col-span-8">
              <p className="t-body-l whitespace-pre-wrap">
                {settings.about_origin_story}
              </p>
            </Reveal>
          </div>
        </section>
      ) : null}

      {values.length > 0 ? (
        <section className="py-24 lg:py-32">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <Reveal className="mb-12">
              <span className="mono-tag">02 / Values</span>
              <h2 className="t-display-l mt-5 font-display">
                The code
                <br />
                <span className="text-muted">we live by.</span>
              </h2>
            </Reveal>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {values.map((v, i) => (
                <Reveal
                  key={v.id}
                  delay={((i % 3) + 1) as 1 | 2 | 3}
                  className="surface-card p-7"
                >
                  <ServiceIcon name={v.icon ?? undefined} className="w-5 h-5 text-brand-500" />
                  <h3 className="t-heading-l font-display mt-5">{v.title}</h3>
                  <p className="t-body text-muted mt-3">{v.description}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Stats */}
      {settings.stats.length > 0 ? (
      <section className="py-24 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
        <div className="relative max-w-[1280px] mx-auto px-6 lg:px-10">
          <Reveal className="mb-12">
            <span className="mono-tag">03 / Receipts</span>
            <h2 className="t-display-l mt-5 font-display">
              The numbers, plain.
            </h2>
          </Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {settings.stats.map((s) => (
              <div key={s.label} className="surface-card p-7">
                <div className="font-display text-4xl tracking-tight">
                  {s.value}
                  {s.suffix ? <span className="text-muted">{s.suffix}</span> : null}
                </div>
                <div className="t-mono text-muted text-[11px] uppercase tracking-wider mt-3">
                  {s.label}
                </div>
                {s.context ? (
                  <div className="t-small text-muted mt-2">{s.context}</div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>
      ) : null}

      {team.length > 0 ? (
        <section className="py-24 lg:py-32">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <Reveal className="mb-12">
              <span className="mono-tag">04 / Team</span>
              <h2 className="t-display-l mt-5 font-display">
                Twelve humans.
                <br />
                <span className="text-muted">No outsourced second shift.</span>
              </h2>
            </Reveal>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {team.map((t) => (
                <div key={t.id} className="surface-card p-6">
                  <div className="aspect-square rounded-lg bg-gradient-to-br from-surface-2 to-bg mb-5 flex items-center justify-center">
                    <span className="font-display text-4xl text-muted">
                      {t.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                  </div>
                  <h3 className="t-heading-l font-display">{t.name}</h3>
                  {t.role ? (
                    <div className="t-mono text-muted text-xs mt-1">{t.role}</div>
                  ) : null}
                  {t.bio ? (
                    <p className="t-small text-muted mt-3 line-clamp-3">{t.bio}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {settings.about_philosophy ? (
        <section className="py-24 lg:py-32">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <div className="surface-card p-10 lg:p-14 max-w-3xl mx-auto">
              <span className="mono-tag">05 / Philosophy</span>
              <p className="t-display-l font-display mt-6">
                {settings.about_philosophy}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="py-24 lg:py-32 relative overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="surface-card p-10 lg:p-14 text-center relative overflow-hidden">
            <div className="mesh opacity-50" />
            <div className="relative">
              <span className="mono-tag justify-center">Engage</span>
              <h2 className="t-display-l mt-5 font-display">Work with us.</h2>
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
