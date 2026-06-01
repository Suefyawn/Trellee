"use server";

import { sendBookingEmails } from "@/lib/email";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { validateBooking } from "@/lib/validation";

export type BookingInput = {
  service_slug?: string;
  time_slot_at?: string;
  timezone?: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  notes?: string;
};

export type BookingResult =
  | { ok: true; id: string | null }
  | { ok: false; error: string };

export async function submitBooking(input: BookingInput): Promise<BookingResult> {
  const validationError = validateBooking(input);
  if (validationError) return { ok: false, error: validationError };

  const supabaseConfigured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("YOUR-PROJECT-REF");

  if (!supabaseConfigured) {
    console.info("[booking] (no-supabase) received:", input);
    // Even without a DB, still send the notification emails if Resend is set
    // up — emails are independent best-effort, useful for local testing too.
    await sendBookingEmails({
      id: null,
      name: input.name,
      email: input.email,
      company: input.company,
      phone: input.phone,
      notes: input.notes,
      service_slug: input.service_slug,
      time_slot_at: input.time_slot_at,
      timezone: input.timezone,
    });
    return { ok: true, id: null };
  }

  try {
    const sb = createSupabaseAdminClient();

    // Resolve service_id + title from slug for the email payload
    let service_id: string | null = null;
    let service_title: string | undefined;
    if (input.service_slug) {
      const { data } = await sb
        .from("services")
        .select("id, title")
        .eq("slug", input.service_slug)
        .maybeSingle<{ id: string; title: string }>();
      service_id = data?.id ?? null;
      service_title = data?.title;
    }

    const { data, error } = await sb
      .from("bookings")
      .insert({
        service_id,
        service_slug: input.service_slug ?? null,
        time_slot_at: input.time_slot_at ?? null,
        timezone: input.timezone ?? null,
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        company: input.company?.trim() || null,
        phone: input.phone?.trim() || null,
        notes: input.notes?.trim() || null,
        status: "new",
      })
      .select("id")
      .maybeSingle<{ id: string }>();

    if (error) {
      console.error("[booking] insert error", error);
      return { ok: false, error: "Could not save your request. Please try again." };
    }

    // Fire-and-await emails. The DB row is already saved, so even if every
    // email call fails the booking is preserved. We await here so the server
    // action lifecycle finishes the emails (otherwise the serverless runtime
    // could cut them off mid-send).
    await sendBookingEmails({
      id: data?.id ?? null,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      company: input.company?.trim(),
      phone: input.phone?.trim(),
      notes: input.notes?.trim(),
      service_title,
      service_slug: input.service_slug,
      time_slot_at: input.time_slot_at,
      timezone: input.timezone,
    });

    return { ok: true, id: data?.id ?? null };
  } catch (err) {
    console.error("[booking] threw", err);
    return { ok: false, error: "Something went wrong. Try again in a minute." };
  }
}
