"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireOwner } from "./guard";
import { actionError } from "@/lib/action-error";
import type { CrmStage } from "@/lib/types/database";

const STAGES: CrmStage[] = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "won",
  "lost",
];

function tableFor(source: "contact" | "booking") {
  return source === "contact" ? "contact_submissions" : "bookings";
}

export async function updateCrmStage(
  source: "contact" | "booking",
  id: string,
  stage: CrmStage,
) {
  await requireOwner();
  if (!STAGES.includes(stage)) return { ok: false as const, error: "Invalid stage." };
  const sb = createSupabaseAdminClient();
  const { error } = await sb
    .from(tableFor(source))
    .update({ pipeline_stage: stage, crm_updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false as const, error: actionError(error) };
  revalidatePath("/admin/crm");
  return { ok: true as const };
}

/** Set the estimated deal value and/or won-lost reason on a lead. */
export async function updateCrmDeal(
  source: "contact" | "booking",
  id: string,
  fields: { deal_value?: number | null; outcome_reason?: string | null },
) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const update: {
    crm_updated_at: string;
    deal_value?: number | null;
    outcome_reason?: string | null;
  } = { crm_updated_at: new Date().toISOString() };
  if ("deal_value" in fields) {
    update.deal_value =
      fields.deal_value == null || Number.isNaN(fields.deal_value)
        ? null
        : fields.deal_value;
  }
  if ("outcome_reason" in fields) {
    update.outcome_reason = fields.outcome_reason?.trim() || null;
  }
  const { error } = await sb.from(tableFor(source)).update(update).eq("id", id);
  if (error) return { ok: false as const, error: actionError(error) };
  revalidatePath("/admin/crm");
  return { ok: true as const };
}

export async function updateCrmNotes(
  source: "contact" | "booking",
  id: string,
  notes: string,
) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const { error } = await sb
    .from(tableFor(source))
    .update({ crm_notes: notes.trim() || null, crm_updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false as const, error: actionError(error) };
  revalidatePath("/admin/crm");
  return { ok: true as const };
}
