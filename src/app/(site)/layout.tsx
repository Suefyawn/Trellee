import { getSiteSettings, getSocialLinks, getReviews } from "@/lib/cms";
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
  const [settings, social, reviews] = await Promise.all([
    getSiteSettings(),
    getSocialLinks(),
    getReviews(),
  ]);

  // AggregateRating from genuine, displayed client testimonials (the reviews
  // carousel) — only emitted when real ratings exist, never fabricated.
  const rated = reviews.filter(
    (r): r is typeof r & { rating: number } =>
      typeof r.rating === "number" && r.rating > 0,
  );
  const aggregateRating =
    rated.length > 0
      ? {
          "@type": "AggregateRating",
          ratingValue: (
            rated.reduce((sum, r) => sum + r.rating, 0) / rated.length
          ).toFixed(1),
          reviewCount: rated.length,
          bestRating: 5,
          worstRating: 1,
        }
      : null;

  // ProfessionalService (a LocalBusiness subtype) with a stable @id other nodes
  // can reference. Address/telephone/geo are added automatically once those
  // fields are populated in site settings.
  const organization = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${SITE_URL}/#organization`,
    name: settings.company_name ?? "Trellee",
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/brand/trellee-logo.png`,
      width: 512,
      height: 512,
    },
    image: `${SITE_URL}/brand/trellee-logo.png`,
    foundingDate: "2016",
    description:
      settings.tagline ??
      "Full-stack digital agency: brand, web, mobile, CRMs, AI, and growth, from one team.",
    ...(settings.email ? { email: settings.email } : {}),
    ...(settings.city
      ? { areaServed: { "@type": "City", name: settings.city } }
      : {}),
    sameAs: social.map((s) => s.url),
    ...(aggregateRating ? { aggregateRating } : {}),
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: settings.company_name ?? "Trellee",
    url: SITE_URL,
    publisher: { "@id": `${SITE_URL}/#organization` },
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
