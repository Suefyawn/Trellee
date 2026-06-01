"use server";

import { notifyNewsletterSignup } from "@/lib/email";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type NewsletterResult = { ok: true } | { ok: false; error: string };

export async function subscribeNewsletter(
  email: string,
  source = "blog",
): Promise<NewsletterResult> {
  const e = (email ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(e)) {
    return { ok: false, error: "Enter a valid email address." };
  }

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
        .upsert({ email: e, source }, { onConflict: "email", ignoreDuplicates: true });
      if (error) {
        console.error("[newsletter] insert error", error);
        return { ok: false, error: "Could not subscribe. Please try again." };
      }
    } else {
      console.info("[newsletter] (no-supabase) received:", e);
    }

    // Best-effort: add to Resend audience + notify owner.
    await notifyNewsletterSignup(e, source);
    return { ok: true };
  } catch (err) {
    console.error("[newsletter] threw", err);
    return { ok: false, error: "Something went wrong. Try again in a minute." };
  }
}
