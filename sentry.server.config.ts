/**
 * Sentry — server runtime init.
 *
 * Loaded by `src/instrumentation.ts` on the Node.js runtime. Entirely inert
 * until `NEXT_PUBLIC_SENTRY_DSN` is set, so the app runs identically with no
 * Sentry account configured.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment:
      process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ??
      process.env.VERCEL_ENV ??
      process.env.NODE_ENV,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
    // Don't send PII (IPs, headers) by default; flip on deliberately if needed.
    sendDefaultPii: false,
  });
}
