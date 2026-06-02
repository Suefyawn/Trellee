import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageBody, AdminPageHeader } from "@/components/admin/admin-page";
import { ProjectForm } from "@/components/admin/project-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteProjectAction } from "@/app/admin/_actions/wrappers";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getServices } from "@/lib/cms";
import type { ProjectRow } from "@/lib/types/database";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !url.includes("YOUR-PROJECT-REF");
}

export const dynamic = "force-dynamic";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <>
        <AdminPageHeader
          title="Project"
          back={{ href: "/admin/projects", label: "Projects" }}
        />
        <AdminPageBody>
          <div className="rounded-lg border border-warning/40 bg-warning/5 p-5">
            <h3 className="t-heading-l font-display">Supabase isn&apos;t connected.</h3>
            <p className="t-body text-muted mt-2 max-w-xl">
              Demo projects can&apos;t be edited. Wire Supabase up to add real case studies.
            </p>
            <Link href="/admin" className="btn btn-secondary mt-4 inline-flex">
              Back to dashboard
            </Link>
          </div>
        </AdminPageBody>
      </>
    );
  }

  const sb = createSupabaseAdminClient();
  const { data } = await sb.from("projects").select("*").eq("id", id).maybeSingle<ProjectRow>();
  if (!data) notFound();
  const services = await getServices();

  return (
    <>
      <AdminPageHeader
        title={data.title}
        description={`Editing project · slug: ${data.slug}`}
        back={{ href: "/admin/projects", label: "Projects" }}
        actions={
          <DeleteButton
            onDelete={deleteProjectAction.bind(null, data.id)}
            redirectTo="/admin/projects"
            label="Delete project"
            confirmText="Confirm delete"
          />
        }
      />
      <AdminPageBody>
        <ProjectForm initial={data} services={services} />
      </AdminPageBody>
    </>
  );
}
