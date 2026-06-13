"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireOwner } from "./guard";
import { actionError } from "@/lib/action-error";

export type ServiceFormInput = {
  id?: string;
  slug: string;
  title: string;
  short_title?: string;
  icon?: string;
  category?: string;
  tags?: string[];
  tile_size: "sm" | "md" | "lg" | "xl";
  featured: boolean;
  display_order: number;
  hero_snippet?: string;
  summary?: string;
  problem_statement?: string;
  approach_pillars?: { title: string; description: string; icon?: string }[];
  deliverables?: { title: string; description: string; icon?: string }[];
  hero_code?: string;
  hero_code_lang?: string;
  meta_title?: string;
  meta_description?: string;
};

export async function upsertService(input: ServiceFormInput) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const payload = {
    slug: input.slug,
    title: input.title,
    short_title: input.short_title || null,
    icon: input.icon || null,
    category: input.category || null,
    tags: input.tags ?? [],
    tile_size: input.tile_size,
    featured: input.featured,
    display_order: input.display_order,
    hero_snippet: input.hero_snippet || null,
    summary: input.summary || null,
    problem_statement: input.problem_statement || null,
    approach_pillars: input.approach_pillars ?? [],
    deliverables: input.deliverables ?? [],
    hero_code: input.hero_code || null,
    hero_code_lang: input.hero_code_lang || null,
    meta_title: input.meta_title || null,
    meta_description: input.meta_description || null,
  };

  let id = input.id;
  if (id) {
    const { error } = await sb.from("services").update(payload).eq("id", id);
    if (error) return { ok: false, error: actionError(error) };
  } else {
    const { data, error } = await sb
      .from("services")
      .insert(payload)
      .select("id")
      .maybeSingle<{ id: string }>();
    if (error) return { ok: false, error: actionError(error) };
    id = data?.id;
  }
  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath(`/services/${input.slug}`);
  revalidatePath("/");
  return { ok: true as const, id };
}

/** Persist a new ordering: each id's display_order becomes its array index. */
export async function reorderServices(ids: string[]) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  for (let i = 0; i < ids.length; i++) {
    const { error } = await sb
      .from("services")
      .update({ display_order: i })
      .eq("id", ids[i]);
    if (error) return { ok: false as const, error: actionError(error) };
  }
  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath("/");
  return { ok: true as const };
}

export async function deleteService(id: string) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("services").delete().eq("id", id);
  if (error) return { ok: false, error: actionError(error) };
  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath("/");
  return { ok: true as const };
}
