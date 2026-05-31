import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { AdminPageBody, AdminPageHeader } from "@/components/admin/admin-page";
import { LeadsTable } from "@/components/admin/leads-table";
import type { ContactSubmissionRow } from "@/lib/types/database";

export const dynamic = "force-dynamic";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !url.includes("YOUR-PROJECT-REF");
}

async function loadLeads(): Promise<ContactSubmissionRow[]> {
  if (!isSupabaseConfigured()) return [];
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("contact_submissions")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as ContactSubmissionRow[];
}

export default async function AdminLeadsPage() {
  const leads = await loadLeads();
  return (
    <>
      <AdminPageHeader
        title="Contact leads"
        description="Briefs from the /contact form."
      />
      <AdminPageBody>
        {leads.length === 0 ? (
          <p className="t-body text-muted">No leads yet.</p>
        ) : (
          <LeadsTable initial={leads} />
        )}
      </AdminPageBody>
    </>
  );
}
