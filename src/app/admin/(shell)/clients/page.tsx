import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { AdminPageBody, AdminPageHeader } from "@/components/admin/admin-page";
import { ClientsEditor } from "@/components/admin/clients-editor";
import { demoClients } from "@/lib/cms/demo-data";
import type { ClientRow } from "@/lib/types/database";

export const dynamic = "force-dynamic";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !url.includes("YOUR-PROJECT-REF");
}

async function getClients(): Promise<ClientRow[]> {
  if (!isSupabaseConfigured()) return demoClients;
  const sb = createSupabaseAdminClient();
  const { data } = await sb.from("clients").select("*").order("display_order");
  return (data ?? []) as ClientRow[];
}

export default async function AdminClientsPage() {
  const clients = await getClients();
  return (
    <>
      <AdminPageHeader
        title="Clients"
        description="The marquee logo bar on the homepage. Featured clients appear first."
      />
      <AdminPageBody>
        <ClientsEditor initial={clients} />
      </AdminPageBody>
    </>
  );
}
