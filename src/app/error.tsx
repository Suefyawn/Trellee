"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";

/**
 * Global error boundary — catches unexpected runtime errors anywhere in the
 * app and shows an on-brand fallback instead of Next's default. Per Next.js
 * App Router, this MUST be a client component and accept the `reset` prop.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error to whatever client-side logging the host attaches
    // (Sentry, console, etc.). The digest is set by Next on server errors so
    // ops can correlate it with the matching server log entry.
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[GlobalError]", error);
    }
  }, [error]);

  return (
    <main className="relative min-h-[80vh] grid place-items-center overflow-hidden px-6 py-24">
      <div className="mesh absolute inset-0 pointer-events-none" />
      <div className="grid-bg absolute inset-0 pointer-events-none" />

      <div className="relative max-w-xl w-full text-center">
        <div
          aria-hidden
          className="step-num leading-none"
          style={{ fontSize: "clamp(6rem, 14vw, 10rem)" }}
        >
          500
        </div>

        <span className="mono-tag justify-center mt-4">
          Something broke · sorry about that
        </span>

        <h1 className="t-display-l mt-5 font-display">
          That didn&apos;t go to plan.
        </h1>

        <p className="t-body-l text-muted mt-4 max-w-md mx-auto">
          An unexpected error came back from the server. Try refreshing — if it
          keeps happening, drop us a note and we&apos;ll look into it.
        </p>

        {error.digest ? (
          <p className="t-mono text-muted text-xs mt-4">
            ref · {error.digest}
          </p>
        ) : null}

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="btn btn-primary"
          >
            <RefreshCw className="w-4 h-4" /> Try again
          </button>
          <Link href="/" className="btn btn-secondary">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>
          <Link href="/contact" className="btn btn-ghost">
            Report the issue
          </Link>
        </div>
      </div>
    </main>
  );
}
