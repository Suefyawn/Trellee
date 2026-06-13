"use client";

/**
 * PostHog analytics — opt-in product analytics, lazy-loaded.
 *
 * Completely inert until `NEXT_PUBLIC_POSTHOG_KEY` is set: with no key the
 * provider just renders its children and the `posthog-js` library is never
 * even downloaded (it's imported dynamically, so it stays out of the initial
 * bundle). When a key is present the library loads after hydration and
 * pageviews are captured manually on route change (App Router client
 * navigations don't trigger PostHog's automatic capture reliably).
 */

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { PostHog } from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<PostHog | null>(null);

  useEffect(() => {
    if (!POSTHOG_KEY) return;
    let cancelled = false;
    import("posthog-js").then(({ default: posthog }) => {
      if (cancelled) return;
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        capture_pageview: false, // handled manually below
        capture_pageleave: true,
        person_profiles: "identified_only",
        // Never capture the admin panel — it's internal usage, and autocapture
        // would otherwise record interactions with invoice/lead/CRM forms.
        // Dropping every event whose URL is under /admin covers pageviews,
        // autocapture, rageclicks, and pageleave in one place.
        before_send: (event) => {
          if (
            typeof window !== "undefined" &&
            window.location.pathname.startsWith("/admin")
          ) {
            return null;
          }
          return event;
        },
      });
      setClient(posthog);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      {client ? (
        <Suspense fallback={null}>
          <PageviewTracker client={client} />
        </Suspense>
      ) : null}
      {children}
    </>
  );
}

function PageviewTracker({ client }: { client: PostHog }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/admin")) return; // never track the admin panel
    let url = window.origin + pathname;
    const qs = searchParams?.toString();
    if (qs) url += `?${qs}`;
    client.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams, client]);

  return null;
}
