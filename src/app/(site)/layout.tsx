import { getSiteSettings, getSocialLinks } from "@/lib/cms";
import { CustomCursor } from "@/components/site/custom-cursor";
import { JsonLd } from "@/components/seo/json-ld";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import { SITE_URL } from "@/lib/site";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, social] = await Promise.all([
    getSiteSettings(),
    getSocialLinks(),
  ]);

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.company_name ?? "Trellee",
    url: SITE_URL,
    logo: `${SITE_URL}/brand/trellee-logo.png`,
    foundingDate: "2016",
    description:
      settings.tagline ??
      "Full-stack digital agency: brand, web, mobile, CRMs, AI, and growth, from one team.",
    ...(settings.city ? { areaServed: settings.city } : {}),
    sameAs: social.map((s) => s.url),
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: settings.company_name ?? "Trellee",
    url: SITE_URL,
  };

  return (
    <>
      <JsonLd data={[organization, website]} />
      {/* Skip-to-content link — invisible until focused. Lets keyboard users
          jump past the nav without tabbing through every link first. */}
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteNav />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
      {/* Desktop-only signature cursor — self-disables on touch + reduced motion */}
      <CustomCursor />
    </>
  );
}
