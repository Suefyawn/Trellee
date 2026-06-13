"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireOwner } from "./guard";
import { actionError } from "@/lib/action-error";

export type LeadStatus = "new" | "contacted" | "closed" | "spam";

export async function updateLeadStatus(id: string, status: LeadStatus) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const { error } = await sb
    .from("contact_submissions")
    .update({ status })
    .eq("id", id);
  if (error) return { ok: false, error: actionError(error) };
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
  return { ok: true as const };
}

export async function deleteLead(id: string) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("contact_submissions").delete().eq("id", id);
  if (error) return { ok: false, error: actionError(error) };
  revalidatePath("/admin/leads");
  return { ok: true as const };
}
