"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireOwner } from "./guard";
import type {
  ProjectGalleryItem,
  ProjectMetric,
  ProjectTechnology,
} from "@/lib/types/database";

export type ProjectInput = {
  id?: string;
  slug: string;
  title: string;
  client_name?: string;
  summary?: string;
  hero_eyebrow?: string;
  brief?: string;
  approach?: string;
  outcome?: string;
  cover_url?: string;
  thumbnail_url?: string;
  gallery?: ProjectGalleryItem[];
  metrics?: ProjectMetric[];
  technologies?: ProjectTechnology[];
  service_categories?: string[];
  featured: boolean;
  featured_order: number;
  status: "draft" | "published";
  published_at?: string;
  meta_title?: string;
  meta_description?: string;
};

export async function upsertProject(input: ProjectInput) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const payload = {
    slug: input.slug,
    title: input.title,
    client_name: input.client_name || null,
    summary: input.summary || null,
    hero_eyebrow: input.hero_eyebrow || null,
    brief: input.brief || null,
    approach: input.approach || null,
    outcome: input.outcome || null,
    cover_url: input.cover_url || null,
    thumbnail_url: input.thumbnail_url || null,
    gallery: input.gallery ?? [],
    metrics: input.metrics ?? [],
    technologies: input.technologies ?? [],
    service_categories: input.service_categories ?? [],
    featured: input.featured,
    featured_order: input.featured_order,
    status: input.status,
    published_at: input.published_at || new Date().toISOString(),
    meta_title: input.meta_title || null,
    meta_description: input.meta_description || null,
  };
  let id = input.id;
  if (id) {
    const { error } = await sb.from("projects").update(payload).eq("id", id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { data, error } = await sb
      .from("projects")
      .insert(payload)
      .select("id")
      .maybeSingle<{ id: string }>();
    if (error) return { ok: false, error: error.message };
    id = data?.id;
  }
  revalidatePath("/admin/projects");
  revalidatePath("/portfolio");
  revalidatePath(`/portfolio/${input.slug}`);
  revalidatePath("/");
  return { ok: true as const, id };
}

export async function deleteProject(id: string) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("projects").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/projects");
  revalidatePath("/portfolio");
  revalidatePath("/");
  return { ok: true as const };
}

/** Persist a new ordering: each id's featured_order becomes its array index. */
export async function reorderProjects(ids: string[]) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  for (let i = 0; i < ids.length; i++) {
    const { error } = await sb
      .from("projects")
      .update({ featured_order: i })
      .eq("id", ids[i]);
    if (error) return { ok: false as const, error: error.message };
  }
  revalidatePath("/admin/projects");
  revalidatePath("/portfolio");
  revalidatePath("/");
  return { ok: true as const };
}
