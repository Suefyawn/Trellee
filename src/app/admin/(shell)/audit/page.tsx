import { AdminPageBody, AdminPageHeader } from "@/components/admin/admin-page";
import { TableFilter } from "@/components/admin/table-filter";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { AuditLogRow } from "@/lib/types/database";
import { timeAgo, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !url.includes("YOUR-PROJECT-REF");
}

const ACTOR_LABEL: Record<string, string> = {
  service_role: "Admin",
  authenticated: "Admin",
  anon: "Visitor",
  system: "System",
};

const ACTION = {
  INSERT: { verb: "created", cls: "text-brand-500 border-brand-500/40 bg-brand-500/5" },
  UPDATE: { verb: "updated", cls: "text-warning border-warning/40 bg-warning/5" },
  DELETE: { verb: "deleted", cls: "text-danger border-danger/40 bg-danger/5" },
  LOGIN: { verb: "signed in", cls: "text-brand-500 border-brand-500/40 bg-brand-500/5" },
  LOGOUT: { verb: "signed out", cls: "text-muted border-border bg-surface-2" },
  LOGIN_FAILED: { verb: "login failed", cls: "text-danger border-danger/40 bg-danger/5" },
} as const;

export default async function AuditLogPage() {
  if (!isSupabaseConfigured()) {
    return (
      <>
        <AdminPageHeader title="Audit log" />
        <AdminPageBody>
          <p className="t-body text-muted">Connect Supabase to see the system audit log.</p>
        </AdminPageBody>
      </>
    );
  }

  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("audit_log")
    .select("*")
    .order("at", { ascending: false })
    .limit(200)
    .returns<AuditLogRow[]>();
  const rows = data ?? [];

  return (
    <>
      <AdminPageHeader
        title="Audit log"
        description="Every create, update, and delete across the system — captured automatically at the database. Showing the latest 200 events."
        actions={<TableFilter targetId="audit-rows" placeholder="Filter events…" />}
      />
      <AdminPageBody>
        <div className="surface-card overflow-x-auto">
          <table className="w-full min-w-[760px] t-small">
            <thead>
              <tr className="text-left t-mono text-muted text-[11px] uppercase tracking-wider border-b border-border">
                <th className="px-4 py-3 font-normal">When</th>
                <th className="px-4 py-3 font-normal">Who</th>
                <th className="px-4 py-3 font-normal">Action</th>
                <th className="px-4 py-3 font-normal">What</th>
                <th className="px-4 py-3 font-normal">Changes</th>
              </tr>
            </thead>
            <tbody id="audit-rows">
              {rows.map((r) => {
                const a = ACTION[r.action as keyof typeof ACTION] ?? {
                  verb: r.action.toLowerCase(),
                  cls: "text-muted border-border bg-surface-2",
                };
                const entity = r.entity.replace(/_/g, " ");
                return (
                  <tr key={r.id} data-row className="border-b border-border/60 align-top">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span title={formatDate(r.at)} className="text-fg">
                        {timeAgo(r.at)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="t-mono text-muted text-xs">
                        {ACTOR_LABEL[r.actor ?? ""] ?? r.actor ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`badge border ${a.cls}`}>{a.verb}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-fg capitalize">{entity}</span>
                      {r.label ? (
                        <span className="text-muted"> · {r.label}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {r.changed_keys && r.changed_keys.length > 0 ? (
                        <span className="t-mono text-muted text-[11px]">
                          {r.changed_keys
                            .filter((k) => k !== "updated_at" && k !== "crm_updated_at")
                            .slice(0, 6)
                            .join(", ") || "—"}
                        </span>
                      ) : (
                        <span className="t-mono text-muted text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 ? (
            <p className="t-small text-muted p-6">No events recorded yet.</p>
          ) : null}
          <p id="audit-rows-empty" className="t-small text-muted p-6" style={{ display: "none" }}>
            No events match your filter.
          </p>
        </div>
      </AdminPageBody>
    </>
  );
}
