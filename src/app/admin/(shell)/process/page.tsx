import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { AdminPageBody, AdminPageHeader } from "@/components/admin/admin-page";
import { ProcessStepsEditor } from "@/components/admin/process-steps-editor";
import { demoProcessSteps } from "@/lib/cms/demo-data";
import { getServices } from "@/lib/cms";
import type { ProcessStepRow } from "@/lib/types/database";

export const dynamic = "force-dynamic";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !url.includes("YOUR-PROJECT-REF");
}

async function load(): Promise<ProcessStepRow[]> {
  if (!isSupabaseConfigured()) return demoProcessSteps;
  const sb = createSupabaseAdminClient();
  const { data } = await sb.from("process_steps").select("*").order("display_order");
  return (data ?? []) as ProcessStepRow[];
}

export default async function ProcessPage() {
  const [steps, services] = await Promise.all([load(), getServices()]);
  return (
    <>
      <AdminPageHeader
        title="Process steps"
        description="The numbered steps on the homepage process section. Leave service blank for the default global process; assign to a service to override its detail page."
      />
      <AdminPageBody>
        <ProcessStepsEditor initial={steps} services={services} />
      </AdminPageBody>
    </>
  );
}
