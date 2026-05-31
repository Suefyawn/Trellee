import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { AdminPageBody, AdminPageHeader } from "@/components/admin/admin-page";
import { TeamEditor } from "@/components/admin/team-editor";
import { demoTeam } from "@/lib/cms/demo-data";
import type { TeamMemberRow } from "@/lib/types/database";

export const dynamic = "force-dynamic";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !url.includes("YOUR-PROJECT-REF");
}

async function load(): Promise<TeamMemberRow[]> {
  if (!isSupabaseConfigured()) return demoTeam;
  const sb = createSupabaseAdminClient();
  const { data } = await sb.from("team_members").select("*").order("display_order");
  return (data ?? []) as TeamMemberRow[];
}

export default async function TeamPage() {
  return (
    <>
      <AdminPageHeader
        title="Team"
        description="People shown on /about. Authors of blog posts pick from this list."
      />
      <AdminPageBody>
        <TeamEditor initial={await load()} />
      </AdminPageBody>
    </>
  );
}
