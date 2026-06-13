"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireOwner } from "./guard";
import { actionError } from "@/lib/action-error";

export type FAQInput = {
  id?: string;
  question: string;
  answer: string;
  category?: string;
  service_id?: string;
  display_order: number;
};

export async function upsertFAQ(input: FAQInput) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const payload = {
    question: input.question,
    answer: input.answer,
    category: input.category || null,
    service_id: input.service_id || null,
    display_order: input.display_order,
  };
  if (input.id) {
    const { error } = await sb.from("faqs").update(payload).eq("id", input.id);
    if (error) return { ok: false, error: actionError(error) };
  } else {
    const { error } = await sb.from("faqs").insert(payload);
    if (error) return { ok: false, error: actionError(error) };
  }
  revalidatePath("/admin/services");
  revalidatePath("/admin/faqs");
  revalidatePath("/services");
  revalidatePath("/contact");
  return { ok: true as const };
}

export async function deleteFAQ(id: string) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("faqs").delete().eq("id", id);
  if (error) return { ok: false, error: actionError(error) };
  revalidatePath("/admin/services");
  revalidatePath("/admin/faqs");
  revalidatePath("/services");
  revalidatePath("/contact");
  return { ok: true as const };
}
