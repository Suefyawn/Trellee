/**
 * Next.js instrumentation hook. Wires Sentry into the server + edge runtimes
 * and forwards nested React Server Component errors to Sentry's
 * `onRequestError` (a no-op when no DSN is configured).
 */
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
