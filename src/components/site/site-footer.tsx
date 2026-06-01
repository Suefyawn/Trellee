import Link from "next/link";
import {
  getServices,
  getSiteSettings,
  getSocialLinks,
} from "@/lib/cms";
import { Logo } from "./logo";
import { SocialIcon } from "./social-icon";

export async function SiteFooter() {
  const [settings, services, social] = await Promise.all([
    getSiteSettings(),
    getServices(),
    getSocialLinks(),
  ]);

  return (
    <footer className="border-t border-border mt-24">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-16">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-10">
          <div className="col-span-2 md:col-span-5">
            <Link href="/" aria-label="Trellee home" className="inline-block">
              <Logo size="md" />
            </Link>
            <p className="t-body text-muted mt-5 max-w-sm">{settings.tagline}</p>
            <p className="t-mono text-muted mt-6">{settings.city}</p>
            {settings.email ? (
              <a
                href={`mailto:${settings.email}`}
                className="t-mono text-fg hover:text-brand-500 transition"
              >
                {settings.email}
              </a>
            ) : null}

            <div className="flex items-center gap-2 mt-6">
              {social.map((s) => (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-md border border-border bg-surface flex items-center justify-center text-muted hover:text-fg hover:border-border-strong transition"
                  aria-label={s.platform}
                >
                  <SocialIcon platform={s.platform} className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="md:col-span-3">
            <span className="mono-tag">Services</span>
            <ul className="mt-5 space-y-2.5">
              {services.slice(0, 7).map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/services/${s.slug}`}
                    className="t-small text-muted hover:text-fg transition"
                  >
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <span className="mono-tag">Company</span>
            <ul className="mt-5 space-y-2.5">
              <li>
                <Link
                  href="/about"
                  className="t-small text-muted hover:text-fg transition"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/portfolio"
                  className="t-small text-muted hover:text-fg transition"
                >
                  Work
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="t-small text-muted hover:text-fg transition"
                >
                  Field notes
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="t-small text-muted hover:text-fg transition"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <span className="mono-tag">Engage</span>
            <ul className="mt-5 space-y-2.5">
              <li>
                <Link
                  href="/book"
                  className="t-small text-muted hover:text-fg transition"
                >
                  Book a call
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="t-small text-muted hover:text-fg transition"
                >
                  Send a brief
                </Link>
              </li>
              {settings.whatsapp_url ? (
                <li>
                  <a
                    href={settings.whatsapp_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="t-small text-muted hover:text-fg transition"
                  >
                    WhatsApp
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="section-rule mt-16" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-6 t-mono text-muted">
          <span>
            © {new Date().getFullYear()} {settings.company_name} · all rights reserved
          </span>
          <span>built by trellee · v1.0</span>
        </div>
      </div>
    </footer>
  );
}
