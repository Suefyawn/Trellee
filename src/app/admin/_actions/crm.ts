"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireOwner } from "./guard";
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
    .update({ pipeline_stage: stage })
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };
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
    .update({ crm_notes: notes.trim() || null })
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/crm");
  return { ok: true as const };
}
