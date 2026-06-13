/**
 * Canonical site origin + URL helpers.
 *
 * One source of truth for the production origin used by every absolute URL we
 * emit — canonicals, OpenGraph/Twitter, JSON-LD, sitemap, robots. Override per
 * environment with `NEXT_PUBLIC_SITE_URL` (no trailing slash needed). Previously
 * each surface had its own fallback (`localhost:3000`, `trellee.vercel.app`,
 * `trellee.com`), which produced conflicting canonical hosts.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://trellee.com"
).replace(/\/+$/, "");

/**
 * Resolve a possibly-relative asset path to an absolute URL.
 *
 * Supabase public URLs (and any other `http(s)://…`) are already absolute and
 * returned unchanged — this prevents the double-prefix bug where a stored
 * absolute `cover_url` became `https://trellee.com/https://…supabase.co/…`.
 * Only site-relative paths (`/brand/logo.png`) get the origin prepended.
 */
export function absoluteUrl(path: string | null | undefined): string {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}
