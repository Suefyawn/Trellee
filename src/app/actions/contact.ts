"use server";

import { spamReason } from "@/lib/anti-spam";
import { sendContactEmails } from "@/lib/email";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { verifyTurnstile } from "@/lib/turnstile";
import { validateContact, FIELD_LIMITS } from "@/lib/validation";

export type ContactInput = {
  name: string;
  email: string;
  company?: string;
  budget?: string;
  services?: string[];
  message: string;
  source?: string;
  /** Anti-spam honeypot — a hidden field; empty for real humans. */
  hp?: string;
  /** Anti-spam — ms the form was on screen before submit. */
  elapsedMs?: number;
  /** Cloudflare Turnstile token. */
  turnstileToken?: string;
};

export type ContactResult =
  | { ok: true; id: string | null }
  | { ok: false; error: string };

const cap = (v: string | undefined, max: number) => (v ?? "").trim().slice(0, max);

export async function submitContact(input: ContactInput): Promise<ContactResult> {
  // Quarantine, never drop. Anything the heuristics flag OR that fails the
  // Turnstile gate is still SAVED with status='spam' (kept out of the inbox and
  // the default admin view, but reviewable) — so a false positive never loses a
  // real submission. We always report success so bots can't probe the filter.
  const heuristic = spamReason(
    { hp: input.hp, elapsedMs: input.elapsedMs, texts: [input.message] },
    { minFillMs: 2500 },
  );
  const human = await verifyTurnstile(input.turnstileToken);
  const isSpam = !!heuristic || !human;
  const status = isSpam ? "spam" : "new";
  if (isSpam) {
    console.info("[contact] quarantined:", heuristic ?? "turnstile-failed");
  }

  // Real submissions are validated and can surface an error to the user. Spam is
  // stored as-is (capped) and never blocks the UI.
  if (!isSpam) {
    const validationError = validateContact(input);
    if (validationError) return { ok: false, error: validationError };
  }

  const supabaseConfigured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("YOUR-PROJECT-REF");

  if (!supabaseConfigured) {
    console.info("[contact] (no-supabase) received:", { ...input, isSpam });
    // Notify only for real submissions; spam never reaches the inbox.
    if (!isSpam) {
      await sendContactEmails({
        id: null,
        name: input.name,
        email: input.email,
        company: input.company,
        budget: input.budget,
        services: input.services,
        message: input.message,
        source: input.source,
      });
    }
    return { ok: true, id: null };
  }

  try {
    const sb = createSupabaseAdminClient();
    const { data, error } = await sb
      .from("contact_submissions")
      .insert({
        name: cap(input.name, FIELD_LIMITS.name),
        email: cap(input.email, FIELD_LIMITS.email).toLowerCase(),
        company: cap(input.company, FIELD_LIMITS.company) || null,
        budget: cap(input.budget, FIELD_LIMITS.budget) || null,
        services: input.services ?? [],
        message: cap(input.message, FIELD_LIMITS.message),
        source: input.source ?? "contact",
        status,
      })
      .select("id")
      .maybeSingle<{ id: string }>();

    if (error) {
      console.error("[contact] insert error", error);
      return { ok: false, error: "Could not send your message. Please try again." };
    }

    // Email only for real submissions. The DB row is already saved, so even if
    // every email call fails the message isn't lost.
    if (!isSpam) {
      await sendContactEmails({
        id: data?.id ?? null,
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        company: input.company?.trim(),
        budget: input.budget?.trim(),
        services: input.services,
        message: input.message.trim(),
        source: input.source,
      });
    }

    return { ok: true, id: data?.id ?? null };
  } catch (err) {
    console.error("[contact] threw", err);
    return { ok: false, error: "Something went wrong. Try again in a minute." };
  }
}
