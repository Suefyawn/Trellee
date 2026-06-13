import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : "";

/**
 * Content-Security-Policy.
 *
 * `'unsafe-inline'` is required on script/style because this app doesn't run a
 * per-request nonce (that would mean threading nonce logic through the Supabase
 * auth middleware). Even so, the policy still blocks the high-value attack
 * surface: no external/injected script sources, no <base> hijacking, no form
 * exfiltration to other origins, no framing (clickjacking), no plugins.
 *
 * ENFORCED by default (verified against the live site). Allowlisted hosts cover
 * Fontshare/Google fonts, Supabase (images, video, auth/realtime), PostHog,
 * Sentry, Google Tag Manager, and GA4. Set `CSP_ENFORCE=false` to fall back to
 * `Content-Security-Policy-Report-Only` (logs violations without blocking) if a
 * new integration needs a host added.
 */
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  // Cloudflare Turnstile renders its challenge in an iframe.
  "frame-src 'self' https://challenges.cloudflare.com",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' https://*.posthog.com https://www.googletagmanager.com https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://api.fontshare.com https://fonts.googleapis.com",
  "font-src 'self' data: https://cdn.fontshare.com https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://www.googletagmanager.com https://*.google-analytics.com",
  "media-src 'self' https://*.supabase.co",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.posthog.com https://*.ingest.sentry.io https://*.sentry.io https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

// Enforced by default now that the policy is verified against the live site.
// Kill-switch: set CSP_ENFORCE=false to drop back to report-only if a future
// integration trips a violation.
const cspEnforce = process.env.CSP_ENFORCE !== "false";

// Applied to every response.
const securityHeaders = [
  {
    key: cspEnforce
      ? "Content-Security-Policy"
      : "Content-Security-Policy-Report-Only",
    value: csp,
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...(supabaseHost
        ? [{ protocol: "https" as const, hostname: supabaseHost }]
        : []),
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

// Only wrap with Sentry's build plugin when a DSN is configured. Without it the
// config is returned untouched, so local/preview builds with no Sentry account
// behave exactly as before (no source-map upload, no extra build steps).
const config: NextConfig = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      // Source maps are only uploaded when an auth token is present.
      sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
      silent: !process.env.CI,
      widenClientFileUpload: true,
      disableLogger: true,
    })
  : nextConfig;

export default config;
