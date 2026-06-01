import { notFound } from "next/navigation";
import { AdminPageBody, AdminPageHeader } from "@/components/admin/admin-page";
import { PmProjectForm } from "@/components/admin/pm-project-form";
import { PmTaskList } from "@/components/admin/pm-task-list";
import { DeleteButton } from "@/components/admin/delete-button";
import { deletePmProjectAction } from "@/app/admin/_actions/wrappers";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { PmProjectRow, PmTaskRow } from "@/lib/types/database";

export const dynamic = "force-dynamic";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !url.includes("YOUR-PROJECT-REF");
}

export default async function EditPmProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isSupabaseConfigured()) notFound();

  const sb = createSupabaseAdminClient();
  const { data: project } = await sb
    .from("pm_projects")
    .select("*")
    .eq("id", id)
    .maybeSingle<PmProjectRow>();
  if (!project) notFound();

  const { data: tasks } = await sb
    .from("pm_tasks")
    .select("*")
    .eq("project_id", id)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  return (
    <>
      <AdminPageHeader
        title={project.name}
        description={project.client_name ? `Client: ${project.client_name}` : "Project tracker"}
        back={{ href: "/admin/pm", label: "Projects" }}
        actions={
          <DeleteButton
            onDelete={() => deletePmProjectAction(project.id)}
            redirectTo="/admin/pm"
            label="Delete"
            confirmText="Confirm delete"
          />
        }
      />
      <AdminPageBody>
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <PmProjectForm initial={project} />
          <PmTaskList projectId={project.id} initial={(tasks ?? []) as PmTaskRow[]} />
        </div>
      </AdminPageBody>
    </>
  );
}
