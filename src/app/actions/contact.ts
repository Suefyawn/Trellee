"use server";

import { sendContactEmails } from "@/lib/email";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type ContactInput = {
  name: string;
  email: string;
  company?: string;
  budget?: string;
  services?: string[];
  message: string;
  source?: string;
};

export type ContactResult =
  | { ok: true; id: string | null }
  | { ok: false; error: string };

export async function submitContact(input: ContactInput): Promise<ContactResult> {
  if (!input.name?.trim()) return { ok: false, error: "Name is required." };
  if (!input.email?.trim()) return { ok: false, error: "Email is required." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.email))
    return { ok: false, error: "Please enter a valid email." };
  if (!input.message?.trim() || input.message.trim().length < 10)
    return { ok: false, error: "A few more words about the project, please." };

  const supabaseConfigured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("YOUR-PROJECT-REF");

  if (!supabaseConfigured) {
    console.info("[contact] (no-supabase) received:", input);
    // Still attempt to send emails even without a DB — useful for local
    // testing and ensures notifications go out if Supabase ever has an outage.
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
    return { ok: true, id: null };
  }

  try {
    const sb = createSupabaseAdminClient();
    const { data, error } = await sb
      .from("contact_submissions")
      .insert({
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        company: input.company?.trim() || null,
        budget: input.budget?.trim() || null,
        services: input.services ?? [],
        message: input.message.trim(),
        source: input.source ?? "contact",
        status: "new",
      })
      .select("id")
      .maybeSingle<{ id: string }>();

    if (error) {
      console.error("[contact] insert error", error);
      return { ok: false, error: "Could not send your message. Please try again." };
    }

    // Emails are best-effort — the DB row is already saved above, so the
    // user's message isn't lost even if all email calls fail.
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

    return { ok: true, id: data?.id ?? null };
  } catch (err) {
    console.error("[contact] threw", err);
    return { ok: false, error: "Something went wrong. Try again in a minute." };
  }
}
