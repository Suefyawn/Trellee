import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { AdminPageBody, AdminPageHeader } from "@/components/admin/admin-page";
import { MonitorPanel } from "@/components/admin/monitor-panel";
import type { MonitoredSiteRow } from "@/lib/types/database";

export const dynamic = "force-dynamic";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !url.includes("YOUR-PROJECT-REF");
}

export default async function AdminMonitorPage() {
  let sites: MonitoredSiteRow[] = [];
  if (isSupabaseConfigured()) {
    const sb = createSupabaseAdminClient();
    const { data } = await sb
      .from("monitored_sites")
      .select("*")
      .order("is_up", { ascending: true, nullsFirst: false })
      .order("label", { ascending: true });
    sites = (data ?? []) as MonitoredSiteRow[];
  }

  const down = sites.filter((s) => s.active && s.is_up === false).length;

  return (
    <>
      <AdminPageHeader
        title="Website monitor"
        description={
          down > 0
            ? `${down} site${down === 1 ? "" : "s"} currently down. Checks run automatically; you're emailed when status changes.`
            : "Add client sites and we'll check them on a schedule, emailing you when one goes down or recovers."
        }
      />
      <AdminPageBody>
        <MonitorPanel sites={sites} />
      </AdminPageBody>
    </>
  );
}
