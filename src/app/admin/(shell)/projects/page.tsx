import Link from "next/link";
import { Plus } from "lucide-react";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { AdminPageBody, AdminPageHeader } from "@/components/admin/admin-page";
import { TableFilter } from "@/components/admin/table-filter";
import { demoProjects } from "@/lib/cms/demo-data";
import type { ProjectRow } from "@/lib/types/database";
import { formatDate } from "@/lib/utils";

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
        description="Case studies shown on /portfolio and surfaced via service categories."
        actions={
          <div className="flex items-center gap-2">
            <TableFilter targetId="projects-list" placeholder="Filter projects…" />
            <Link href="/admin/projects/new" className="btn btn-primary">
              <Plus className="w-4 h-4" /> New project
            </Link>
          </div>
        }
      />
      <AdminPageBody>
        <div className="surface-card overflow-x-auto">
          <table className="w-full min-w-[640px] t-small">
            <thead>
              <tr className="bg-surface-2/60 t-mono text-muted text-xs uppercase tracking-wider">
                <th className="text-left p-4 font-normal">Title</th>
                <th className="text-left p-4 font-normal">Client</th>
                <th className="text-left p-4 font-normal">Categories</th>
                <th className="text-left p-4 font-normal">Status</th>
                <th className="text-left p-4 font-normal">Published</th>
              </tr>
            </thead>
            <tbody id="projects-list">
              {projects.map((p) => (
                <tr
                  key={p.id}
                  data-row
                  className="border-t border-border hover:bg-surface-2/40 transition"
                >
                  <td className="p-4">
                    <Link
                      href={`/admin/projects/${p.id}`}
                      className="text-fg hover:text-brand-500 transition"
                    >
                      {p.title}
                    </Link>
                    {p.featured ? (
                      <span className="badge badge-brand ml-2 text-[9px]">
                        featured
                      </span>
                    ) : null}
                  </td>
                  <td className="p-4 text-muted">{p.client_name ?? "—"}</td>
                  <td className="p-4 text-muted">
                    {p.service_categories.slice(0, 3).join(", ")}
                  </td>
                  <td className="p-4">
                    <span
                      className={`badge ${
                        p.status === "published" ? "badge-brand" : ""
                      } text-[10px]`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4 t-mono text-muted text-xs">
                    {p.published_at ? formatDate(p.published_at) : "—"}
                  </td>
                </tr>
              ))}
              <tr id="projects-list-empty" style={{ display: "none" }} className="border-t border-border">
                <td colSpan={5} className="p-4 text-center text-muted t-small">
                  No matches.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AdminPageBody>
    </>
  );
}
