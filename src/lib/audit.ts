import { createSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * Record an app-level event into the audit log (the same table DB triggers
 * write to). Used for things that aren't table writes — e.g. auth events.
 * Never throws: a logging failure must not break the action it's logging.
 */
export async function recordAudit(entry: {
  action: string;
  entity: string;
  label?: string | null;
  actor?: string | null;
  entityId?: string | null;
  data?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    const sb = createSupabaseAdminClient();
    await sb.from("audit_log").insert({
      action: entry.action,
      entity: entry.entity,
      label: entry.label ?? null,
      actor: entry.actor ?? "service_role",
      entity_id: entry.entityId ?? null,
      data: entry.data ?? null,
    });
  } catch (e) {
    console.error("[audit] failed to record event", e);
  }
}
