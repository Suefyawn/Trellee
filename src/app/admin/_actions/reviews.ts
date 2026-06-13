"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireOwner } from "./guard";
import { actionError } from "@/lib/action-error";
import { validateUpload } from "@/lib/upload-validation";

export type ReviewInput = {
  id?: string;
  type: "text" | "video";
  author_name: string;
  author_role?: string;
  author_company?: string;
  author_avatar_url?: string;
  quote?: string;
  rating?: number;
  video_url?: string;
  video_thumbnail_url?: string;
  duration?: string;
  project_id?: string;
  featured: boolean;
  display_order: number;
};

export async function upsertReview(input: ReviewInput) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const payload = {
    type: input.type,
    author_name: input.author_name,
    author_role: input.author_role || null,
    author_company: input.author_company || null,
    author_avatar_url: input.author_avatar_url || null,
    quote: input.quote || null,
    rating: input.rating ?? null,
    video_url: input.video_url || null,
    video_thumbnail_url: input.video_thumbnail_url || null,
    duration: input.duration || null,
    project_id: input.project_id || null,
    featured: input.featured,
    display_order: input.display_order,
  };
  if (input.id) {
    const { error } = await sb.from("reviews").update(payload).eq("id", input.id);
    if (error) return { ok: false, error: actionError(error) };
  } else {
    const { error } = await sb.from("reviews").insert(payload);
    if (error) return { ok: false, error: actionError(error) };
  }
  revalidatePath("/admin/reviews");
  revalidatePath("/");
  return { ok: true as const };
}

export async function deleteReview(id: string) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("reviews").delete().eq("id", id);
  if (error) return { ok: false, error: actionError(error) };
  revalidatePath("/admin/reviews");
  revalidatePath("/");
  return { ok: true as const };
}

export type UploadInput = {
  bucket: "media" | "videos";
  filename: string;
  contentType: string;
  base64: string;
};

export type UploadResult =
  | { ok: true; url: string; path: string }
  | { ok: false; error: string };

/**
 * Server-side upload to Supabase Storage. Accepts base64 from a client form
 * so we can keep the service-role key out of the browser.
 */
export async function uploadAsset(input: UploadInput): Promise<UploadResult> {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const bytes = Buffer.from(input.base64, "base64");

  // Never trust the client-supplied contentType/size: sniff the real type from
  // magic bytes, enforce the per-bucket allowlist (SVG and anything executable
  // are rejected — these land in a public bucket), and cap the size.
  const check = validateUpload(input.bucket, bytes);
  if (!check.ok) return { ok: false, error: check.error };

  const safeName = input.filename.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const path = `${Date.now()}-${safeName}`;

  const { error } = await sb.storage
    .from(input.bucket)
    .upload(path, bytes, { contentType: check.contentType, upsert: false });
  if (error) return { ok: false, error: actionError(error) };

  const { data } = sb.storage.from(input.bucket).getPublicUrl(path);
  return { ok: true, url: data.publicUrl, path };
}
