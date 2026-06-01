import Link from "next/link";
import { Plus } from "lucide-react";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { AdminPageBody, AdminPageHeader } from "@/components/admin/admin-page";
import { ProjectsReorder } from "@/components/admin/projects-reorder";
import { demoProjects } from "@/lib/cms/demo-data";
import type { ProjectRow } from "@/lib/types/database";

export const dynamic = "force-dynamic";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !url.includes("YOUR-PROJECT-REF");
}

async function getAllProjects(): Promise<ProjectRow[]> {
  if (!isSupabaseConfigured()) return demoProjects;
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("projects")
    .select("*")
    .order("featured_order", { ascending: true })
    .order("published_at", { ascending: false });
  return (data ?? []) as ProjectRow[];
}

export default async function AdminProjectsPage() {
  const projects = await getAllProjects();
  return (
    <>
      <AdminPageHeader
        title="Projects"
        description="Case studies on /portfolio. Drag to reorder; the order drives the homepage 'selected work' and the portfolio. Open one to edit it."
        actions={
          <Link href="/admin/projects/new" className="btn btn-primary">
            <Plus className="w-4 h-4" /> New project
          </Link>
        }
      />
      <AdminPageBody>
        <ProjectsReorder projects={projects} />
      </AdminPageBody>
    </>
  );
}
