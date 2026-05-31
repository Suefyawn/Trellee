import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { AdminPageBody, AdminPageHeader } from "@/components/admin/admin-page";
import { FAQsEditor } from "@/components/admin/faqs-editor";
import { demoFAQs } from "@/lib/cms/demo-data";
import type { FAQRow } from "@/lib/types/database";

export const dynamic = "force-dynamic";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !url.includes("YOUR-PROJECT-REF");
}

async function load(): Promise<FAQRow[]> {
  if (!isSupabaseConfigured()) return demoFAQs.filter((f) => f.category === "general");
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("faqs")
    .select("*")
    .eq("category", "general")
    .order("display_order");
  return (data ?? []) as FAQRow[];
}

export default async function FAQsPage() {
  return (
    <>
      <AdminPageHeader
        title="General FAQs"
        description='Shown on the /contact page under the "Questions before you ask" section. Per-service FAQs are managed inside each service.'
      />
      <AdminPageBody>
        <FAQsEditor category="general" initial={await load()} />
      </AdminPageBody>
    </>
  );
}
