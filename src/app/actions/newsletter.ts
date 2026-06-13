"use server";

import { spamReason } from "@/lib/anti-spam";
import { notifyNewsletterSignup } from "@/lib/email";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type NewsletterResult = { ok: true } | { ok: false; error: string };

/** Anti-spam signals carried alongside the email. */
export type NewsletterMeta = { hp?: string; elapsedMs?: number };

export async function subscribeNewsletter(
  email: string,
  source = "blog",
  meta: NewsletterMeta = {},
): Promise<NewsletterResult> {
  // Quarantine, never drop. A single email field, so a quicker human fill is
  // fine. (No Turnstile widget here — newsletter isn't a spam target and it'd be
  // overkill on one field; heuristics + quarantine cover it.)
  const isSpam = !!spamReason(
    { hp: meta.hp, elapsedMs: meta.elapsedMs },
    { minFillMs: 1000 },
  );
  const status = isSpam ? "spam" : "active";
  if (isSpam) console.info("[newsletter] quarantined signup");

  const e = (email ?? "").trim().toLowerCase();
  if (!isSpam && !/^\S+@\S+\.\S+$/.test(e)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (!e) return { ok: true }; // nothing to store

  const supabaseConfigured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("YOUR-PROJECT-REF");

  try {
    if (supabaseConfigured) {
      const sb = createSupabaseAdminClient();
      // Idempotent: a repeat signup is a no-op, not an error.
      const { error } = await sb
        .from("newsletter_subscribers")
        .upsert(
          { email: e, source, status },
          { onConflict: "email", ignoreDuplicates: true },
        );
      if (error) {
        console.error("[newsletter] insert error", error);
        return { ok: false, error: "Could not subscribe. Please try again." };
      }
    } else {
      console.info("[newsletter] (no-supabase) received:", e, { isSpam });
    }

    // Notify only real signups; spam never reaches the inbox/audience.
    if (!isSpam) await notifyNewsletterSignup(e, source);
    return { ok: true };
  } catch (err) {
    console.error("[newsletter] threw", err);
    return { ok: false, error: "Something went wrong. Try again in a minute." };
  }
}
