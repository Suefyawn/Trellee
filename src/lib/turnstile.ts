/**
 * Cloudflare Turnstile server-side verification.
 *
 * The gate is **inert until `TURNSTILE_SECRET_KEY` is set** (mirrors how Sentry/
 * PostHog/GA stay off without their env). With a secret configured, a submission
 * must carry a token that Cloudflare validates; otherwise it's treated as a bot
 * and quarantined (never dropped) by the caller.
 *
 * Design choice for "never lose a real submission": on a network error talking
 * to Cloudflare we **fail open** (treat as human). A Cloudflare outage must not
 * silently quarantine genuine leads — the honeypot/time-trap heuristics still
 * apply as a backstop.
 */
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** True if the submission is human (or the gate is disabled). */
export async function verifyTurnstile(
  token: string | null | undefined,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // gate disabled — no keys configured
  if (!token) {
    // The browser didn't produce a token — widget didn't render/solve (domain
    // not allowlisted, interactive challenge not completed, or submitted before
    // it resolved).
    console.warn("[turnstile] no token in submission");
    return false;
  }

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = (await res.json()) as {
      success?: boolean;
      "error-codes"?: string[];
    };
    if (data.success !== true) {
      // Cloudflare's error-codes pinpoint the misconfig: invalid-input-secret
      // (wrong/mismatched secret), invalid-input-response (bad/foreign token),
      // timeout-or-duplicate (token reused/expired), etc.
      console.warn(
        "[turnstile] verify rejected, error-codes:",
        JSON.stringify(data["error-codes"] ?? []),
      );
    }
    return data.success === true;
  } catch (err) {
    // Fail open on infrastructure errors so a Cloudflare outage never costs a
    // real lead. Heuristics + quarantine remain in force for actual spam.
    console.error("[turnstile] verify failed, allowing through:", err);
    return true;
  }
}

/** Whether the Turnstile gate is configured at all (used by callers/UI). */
export const TURNSTILE_ENABLED = !!process.env.TURNSTILE_SECRET_KEY;
