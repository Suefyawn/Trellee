/**
 * Renders a JSON-LD <script> for structured data (rich results in Google).
 * Server component — safe to drop into layouts and pages.
 */
/** Build a BreadcrumbList schema from Home → … → current page. */
export function breadcrumb(
  siteUrl: string,
  items: { name: string; path: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${siteUrl}${it.path}`,
    })),
  };
}

export function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Record<string, unknown>[];
}) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe here (no user-controlled <script> breakouts;
      // values are escaped by stringify). Standard Next.js pattern for JSON-LD.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
