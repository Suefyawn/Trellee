"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Last-resort boundary for errors thrown in the ROOT layout itself (font links,
 * providers) — the segment `error.tsx` can't catch those because it renders
 * inside the layout. `global-error` replaces the whole document, so it must
 * provide its own <html>/<body> and can't rely on the design system / globals
 * (they may be exactly what failed). Production-only; in dev Next shows its
 * overlay instead.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#06070a",
          color: "#f5f6f7",
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "32rem" }}>
          <h1 style={{ fontSize: "2rem", margin: "0 0 0.75rem" }}>
            That didn&apos;t go to plan.
          </h1>
          <p style={{ color: "#9aa0a6", lineHeight: 1.6, margin: "0 0 1.5rem" }}>
            An unexpected error came back from the server. Try refreshing — if it
            keeps happening, please let us know.
          </p>
          {error.digest ? (
            <p
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: "0.75rem",
                color: "#6b7280",
                marginBottom: "1.5rem",
              }}
            >
              ref · {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => reset()}
            style={{
              cursor: "pointer",
              border: "1px solid #2a2d34",
              background: "#f5f6f7",
              color: "#06070a",
              borderRadius: "8px",
              padding: "0.6rem 1.2rem",
              fontWeight: 600,
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
