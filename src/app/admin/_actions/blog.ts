"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireOwner } from "./guard";

export type BlogPostInput = {
  id?: string;
  slug: string;
  title: string;
  excerpt?: string;
  body?: string;
  cover_url?: string;
  category_id?: string;
  author_id?: string;
  reading_time?: number;
  featured: boolean;
  status: "draft" | "published";
  published_at?: string;
  meta_title?: string;
  meta_description?: string;
};

export async function upsertBlogPost(input: BlogPostInput) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const payload = {
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt || null,
    body: input.body || null,
    cover_url: input.cover_url || null,
    category_id: input.category_id || null,
    author_id: input.author_id || null,
    reading_time: input.reading_time ?? null,
    featured: input.featured,
    status: input.status,
    published_at:
      input.status === "published"
        ? input.published_at || new Date().toISOString()
        : input.published_at || null,
    meta_title: input.meta_title || null,
    meta_description: input.meta_description || null,
  };
  let id = input.id;
  if (id) {
    const { error } = await sb.from("blog_posts").update(payload).eq("id", id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { data, error } = await sb
      .from("blog_posts")
      .insert(payload)
      .select("id")
      .maybeSingle<{ id: string }>();
    if (error) return { ok: false, error: error.message };
    id = data?.id;
  }
  revalidatePath("/admin/blog/posts");
  revalidatePath("/blog");
  revalidatePath(`/blog/${input.slug}`);
  return { ok: true as const, id };
}

export async function deleteBlogPost(id: string) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("blog_posts").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/blog/posts");
  revalidatePath("/blog");
  return { ok: true as const };
}

export type BlogCategoryInput = {
  id?: string;
  slug: string;
  name: string;
  description?: string;
  display_order: number;
};

export async function upsertBlogCategory(input: BlogCategoryInput) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const payload = {
    slug: input.slug,
    name: input.name,
    description: input.description || null,
    display_order: input.display_order,
  };
  if (input.id) {
    const { error } = await sb.from("blog_categories").update(payload).eq("id", input.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await sb.from("blog_categories").insert(payload);
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath("/admin/blog/categories");
  revalidatePath("/blog");
  return { ok: true as const };
}

export async function deleteBlogCategory(id: string) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("blog_categories").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/blog/categories");
  revalidatePath("/blog");
  return { ok: true as const };
}
