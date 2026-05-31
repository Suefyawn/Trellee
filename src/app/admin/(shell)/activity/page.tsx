import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { AdminPageBody, AdminPageHeader } from "@/components/admin/admin-page";
import { ActivityEditor } from "@/components/admin/activity-editor";
import { demoActivity } from "@/lib/cms/demo-data";
import type { ActivityFeedRow } from "@/lib/types/database";

export const dynamic = "force-dynamic";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !url.includes("YOUR-PROJECT-REF");
}

async function load(): Promise<ActivityFeedRow[]> {
  if (!isSupabaseConfigured()) return demoActivity;
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("activity_feed")
    .select("*")
    .order("occurred_at", { ascending: false })
    .limit(50);
  return (data ?? []) as ActivityFeedRow[];
}

export default async function ActivityPage() {
  return (
    <>
      <AdminPageHeader
        title="Activity feed"
        description='The "Build log" card on the homepage. Add a new entry each time you ship something noteworthy — keeps the hero feeling alive.'
      />
      <AdminPageBody>
        <ActivityEditor initial={await load()} />
      </AdminPageBody>
    </>
  );
}
