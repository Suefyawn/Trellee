/**
 * Sentry — browser init. Runs once on the client. Inert until
 * `NEXT_PUBLIC_SENTRY_DSN` is set. Session Replay is left off by default
 * (sample rates 0) to keep the bundle and quota cost down; raise the rates
 * once you've decided you want it.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment:
      process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ??
      process.env.NEXT_PUBLIC_VERCEL_ENV ??
      process.env.NODE_ENV,
    tracesSampleRate: Number(
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? "0.1",
    ),
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    sendDefaultPii: false,
  });
}

// Surfaces client navigation errors / spans to Sentry. No-op without a DSN.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
