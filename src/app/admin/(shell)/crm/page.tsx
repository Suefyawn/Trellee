import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { AdminPageBody, AdminPageHeader } from "@/components/admin/admin-page";
import { CrmBoard } from "@/components/admin/crm-board";
import type {
  BookingRow,
  ContactSubmissionRow,
  CrmLead,
} from "@/lib/types/database";

export const dynamic = "force-dynamic";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !url.includes("YOUR-PROJECT-REF");
}

async function loadLeads(): Promise<CrmLead[]> {
  if (!isSupabaseConfigured()) return [];
  const sb = createSupabaseAdminClient();
  const [contacts, bookings] = await Promise.all([
    sb.from("contact_submissions").select("*").order("created_at", { ascending: false }),
    sb.from("bookings").select("*").order("created_at", { ascending: false }),
  ]);

  const fromContacts: CrmLead[] = ((contacts.data ?? []) as ContactSubmissionRow[]).map(
    (c) => ({
      source: "contact",
      id: c.id,
      name: c.name,
      email: c.email,
      company: c.company,
      detail: c.message,
      meta: [c.budget ? `Budget: ${c.budget}` : null, c.services?.length ? c.services.join(", ") : null]
        .filter(Boolean)
        .join(" · ") || null,
      pipeline_stage: c.pipeline_stage ?? "new",
      crm_notes: c.crm_notes,
      created_at: c.created_at,
    }),
  );

  const fromBookings: CrmLead[] = ((bookings.data ?? []) as BookingRow[]).map((b) => ({
    source: "booking",
    id: b.id,
    name: b.name,
    email: b.email,
    company: b.company,
    detail: b.notes,
    meta: [
      b.service_slug ? `Service: ${b.service_slug}` : null,
      b.time_slot_at ? `Slot: ${b.time_slot_at}${b.timezone ? ` (${b.timezone})` : ""}` : null,
    ]
      .filter(Boolean)
      .join(" · ") || null,
    pipeline_stage: b.pipeline_stage ?? "new",
    crm_notes: b.crm_notes,
    created_at: b.created_at,
  }));

  return [...fromContacts, ...fromBookings].sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1,
  );
}

export default async function AdminCrmPage() {
  const leads = await loadLeads();
  return (
    <>
      <AdminPageHeader
        title="Pipeline"
        description="Every contact-form brief and booking, in one sales pipeline. Move a lead through the stages and keep private notes."
      />
      <AdminPageBody>
        {leads.length === 0 ? (
          <p className="t-body text-muted">
            No leads yet. Submissions from the contact form and the booking flow
            will show up here automatically.
          </p>
        ) : (
          <CrmBoard leads={leads} />
        )}
      </AdminPageBody>
    </>
  );
}
