/**
 * Fire a named PostHog event from client components. Uses the same posthog-js
 * singleton the provider initialises. No-op (and never loads the lib) when
 * analytics isn't configured, so it's safe to call anywhere.
 */
export function track(event: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  import("posthog-js")
    .then(({ default: posthog }) => posthog.capture(event, props))
    .catch(() => {});
}
