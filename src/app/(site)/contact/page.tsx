import { Mail, MessageCircle, Phone } from "lucide-react";
import { getFAQs, getServices, getSiteSettings } from "@/lib/cms";
import { Reveal } from "@/components/site/reveal";
import { ContactForm } from "@/components/site/contact-form";
import { FAQAccordion } from "@/components/site/faq-accordion";

// Contact reads only CMS data (settings/services/FAQs), so it can be ISR-cached
// like the rest of the site instead of rendering dynamically on every request.
export const revalidate = 600;

export const metadata = {
  title: "Contact",
  description: "Send a brief or book a call. We read every message.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const [settings, services, faqs] = await Promise.all([
    getSiteSettings(),
    getServices(),
    getFAQs({ category: "general" }),
  ]);

  return (
    <>
      <section className="relative pt-16 pb-12 lg:pt-24 lg:pb-16 overflow-hidden">
        <div className="mesh" />
        <div className="relative max-w-[1280px] mx-auto px-6 lg:px-10">
          <Reveal>
            <span className="mono-tag">Contact</span>
            <h1 className="t-display-xl mt-5 max-w-[20ch] font-display">
              Tell us about
              <br />
              <span className="text-muted">the project.</span>
            </h1>
            <p className="t-body-l text-muted mt-6 max-w-2xl">
              {settings.contact_intro ??
                "Send the brief, or book a 30-minute call. We read every message and respond within a business day."}
            </p>
          </Reveal>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 grid lg:grid-cols-12 gap-10">
          {/* Methods */}
          <div className="lg:col-span-4 space-y-3">
            <Reveal className="surface-card p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-brand-500" />
              </div>
              <div>
                <span className="mono-tag">Email</span>
                <h3 className="t-heading-l font-display mt-2">Send a brief</h3>
                <p className="t-small text-muted mt-2">{settings.response_time}</p>
                {settings.email ? (
                  <a
                    href={`mailto:${settings.email}`}
                    className="t-mono text-fg hover:text-brand-500 transition block mt-3"
                  >
                    {settings.email}
                  </a>
                ) : null}
              </div>
            </Reveal>
            {settings.calendar_url ? (
              <Reveal delay={1} className="surface-card p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-brand-500" />
                </div>
                <div>
                  <span className="mono-tag">Call</span>
                  <h3 className="t-heading-l font-display mt-2">Book direct</h3>
                  <p className="t-small text-muted mt-2">
                    30 minutes. Pick a slot that works.
                  </p>
                  <a
                    href={settings.calendar_url}
                    className="t-mono text-fg hover:text-brand-500 transition block mt-3"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open calendar
                  </a>
                </div>
              </Reveal>
            ) : null}
            {settings.whatsapp_url ? (
              <Reveal delay={2} className="surface-card p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-5 h-5 text-brand-500" />
                </div>
                <div>
                  <span className="mono-tag">WhatsApp</span>
                  <h3 className="t-heading-l font-display mt-2">Quick question?</h3>
                  <p className="t-small text-muted mt-2">
                    Usually under an hour, business days.
                  </p>
                  <a
                    href={settings.whatsapp_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="t-mono text-fg hover:text-brand-500 transition block mt-3"
                  >
                    Message us
                  </a>
                </div>
              </Reveal>
            ) : null}
          </div>

          {/* Form */}
          <Reveal delay={1} className="lg:col-span-8 surface-card p-8 lg:p-10">
            <ContactForm services={services} />
          </Reveal>
        </div>
      </section>

      {faqs.length > 0 ? (
        <section className="py-24 lg:py-32">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <Reveal className="mb-10">
              <span className="mono-tag">FAQ</span>
              <h2 className="t-display-l mt-5 font-display">
                Questions before you ask.
              </h2>
            </Reveal>
            <FAQAccordion items={faqs} />
          </div>
        </section>
      ) : null}
    </>
  );
}
