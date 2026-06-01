import Link from "next/link";
import { Plus } from "lucide-react";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { AdminPageBody, AdminPageHeader } from "@/components/admin/admin-page";
import type { PmProjectRow } from "@/lib/types/database";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !url.includes("YOUR-PROJECT-REF");
}

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  on_hold: "On hold",
  done: "Done",
  archived: "Archived",
};

export default async function AdminPmPage() {
  let projects: PmProjectRow[] = [];
  const progress: Record<string, { done: number; total: number }> = {};

  if (isSupabaseConfigured()) {
    const sb = createSupabaseAdminClient();
    const [{ data: rows }, { data: tasks }] = await Promise.all([
      sb.from("pm_projects").select("*").order("created_at", { ascending: false }),
      sb.from("pm_tasks").select("project_id, done"),
    ]);
    projects = (rows ?? []) as PmProjectRow[];
    for (const t of (tasks ?? []) as { project_id: string; done: boolean }[]) {
      const p = (progress[t.project_id] ??= { done: 0, total: 0 });
      p.total += 1;
      if (t.done) p.done += 1;
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Projects"
        description="Internal project tracker — client work, status, and task checklists. (Separate from the public portfolio.)"
        actions={
          <Link href="/admin/pm/new" className="btn btn-primary">
            <Plus className="w-4 h-4" /> New project
          </Link>
        }
      />
      <AdminPageBody>
        {projects.length === 0 ? (
          <div className="surface-card p-8 text-center">
            <p className="t-body text-muted">No projects yet.</p>
            <Link href="/admin/pm/new" className="btn btn-primary mt-4 inline-flex">
              <Plus className="w-4 h-4" /> Create your first project
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => {
              const pr = progress[p.id] ?? { done: 0, total: 0 };
              const pct = pr.total ? Math.round((pr.done / pr.total) * 100) : 0;
              return (
                <Link
                  key={p.id}
                  href={`/admin/pm/${p.id}`}
                  className="bento-tile p-6 group flex flex-col justify-between min-h-[160px]"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="t-heading-l font-display">{p.name}</h3>
                      <span className="badge text-[10px] flex-shrink-0">
                        {STATUS_LABEL[p.status] ?? p.status}
                      </span>
                    </div>
                    {p.client_name ? (
                      <div className="t-mono text-muted text-xs mt-1">{p.client_name}</div>
                    ) : null}
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between t-mono text-muted text-[11px] mb-1.5">
                      <span>{pr.done}/{pr.total} tasks</span>
                      {p.due_date ? <span>due {formatDate(p.due_date)}</span> : null}
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                      <div className="h-full bg-brand-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </AdminPageBody>
    </>
  );
}
