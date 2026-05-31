import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { AdminPageBody, AdminPageHeader } from "@/components/admin/admin-page";
import { ValuesEditor } from "@/components/admin/values-editor";
import { demoValues } from "@/lib/cms/demo-data";
import type { ValueRow } from "@/lib/types/database";

export const dynamic = "force-dynamic";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !url.includes("YOUR-PROJECT-REF");
}

async function load(): Promise<ValueRow[]> {
  if (!isSupabaseConfigured()) return demoValues;
  const sb = createSupabaseAdminClient();
  const { data } = await sb.from("values").select("*").order("display_order");
  return (data ?? []) as ValueRow[];
}

export default async function ValuesPage() {
  return (
    <>
      <AdminPageHeader
        title="Values"
        description="The six principles shown on /about."
      />
      <AdminPageBody>
        <ValuesEditor initial={await load()} />
      </AdminPageBody>
    </>
  );
}
