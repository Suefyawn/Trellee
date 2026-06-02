"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { useUnsavedChanges } from "@/lib/use-unsaved-changes";
import { upsertReviewAction } from "@/app/admin/_actions/wrappers";
import { uploadAsset } from "@/app/admin/_actions/reviews";
import type { ProjectRow, ReviewRow } from "@/lib/types/database";
import { Field, Section } from "./ui";
import { ImageUpload } from "./image-upload";

export function ReviewForm({
  initial,
  projects,
}: {
  initial?: ReviewRow;
  projects: ProjectRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    type: initial?.type ?? ("text" as "text" | "video"),
    author_name: initial?.author_name ?? "",
    author_role: initial?.author_role ?? "",
    author_company: initial?.author_company ?? "",
    author_avatar_url: initial?.author_avatar_url ?? "",
    quote: initial?.quote ?? "",
    rating: initial?.rating ?? 5,
    video_url: initial?.video_url ?? "",
    video_thumbnail_url: initial?.video_thumbnail_url ?? "",
    duration: initial?.duration ?? "",
    project_id: initial?.project_id ?? "",
    featured: initial?.featured ?? false,
    display_order: initial?.display_order ?? 0,
  });

  const [uploading, setUploading] = useState<null | "video" | "thumb" | "avatar">(null);

  const [dirty, setDirty] = useState(false);
  useUnsavedChanges(dirty);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  }

  async function fileToBase64(file: File): Promise<string> {
    const buf = await file.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  async function handleUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    bucket: "media" | "videos",
    target: "video" | "thumb" | "avatar",
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(target);
    setErr(null);
    try {
      const base64 = await fileToBase64(file);
      const res = await uploadAsset({
        bucket,
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        base64,
      });
      if (res.ok) {
        if (target === "video") set("video_url", res.url);
        else if (target === "thumb") set("video_thumbnail_url", res.url);
        else if (target === "avatar") set("author_avatar_url", res.url);
      } else {
        setErr(res.error);
      }
    } catch (e2) {
      setErr(String(e2));
    } finally {
      setUploading(null);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaved(false);
    if (!form.author_name.trim()) {
      setErr("Author name is required.");
      return;
    }
    if (form.type === "text" && !form.quote.trim()) {
      setErr("Text reviews need a quote.");
      return;
    }
    if (form.type === "video" && !form.video_url.trim()) {
      setErr("Video reviews need a video URL.");
      return;
    }
    startTransition(async () => {
      const res = await upsertReviewAction({
        id: initial?.id,
        type: form.type,
        author_name: form.author_name.trim(),
        author_role: form.author_role || undefined,
        author_company: form.author_company || undefined,
        author_avatar_url: form.author_avatar_url || undefined,
        quote: form.quote || undefined,
        rating: Number(form.rating) || undefined,
        video_url: form.video_url || undefined,
        video_thumbnail_url: form.video_thumbnail_url || undefined,
        duration: form.duration || undefined,
        project_id: form.project_id || undefined,
        featured: form.featured,
        display_order: Number(form.display_order) || 0,
      });
      if (!res.ok) {
        setErr(res.error ?? "Could not save.");
        return;
      }
      setSaved(true);
      setDirty(false);
      router.push("/admin/reviews");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Section title="Review type">
        <div className="flex gap-2">
          {(["text", "video"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set("type", t)}
              className={`btn ${form.type === t ? "btn-primary" : "btn-secondary"}`}
            >
              {t === "text" ? "Text quote" : "Video review"}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Author">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Name">
            <input
              className="input"
              required
              value={form.author_name}
              onChange={(e) => set("author_name", e.target.value)}
            />
          </Field>
          <Field label="Role">
            <input
              className="input"
              value={form.author_role}
              onChange={(e) => set("author_role", e.target.value)}
            />
          </Field>
          <Field label="Company">
            <input
              className="input"
              value={form.author_company}
              onChange={(e) => set("author_company", e.target.value)}
            />
          </Field>
          <div>
            <ImageUpload
              label="Avatar (optional)"
              rounded
              value={form.author_avatar_url}
              onChange={(url) => set("author_avatar_url", url)}
            />
          </div>
        </div>
      </Section>

      {form.type === "text" ? (
        <Section title="Quote">
          <Field label="What did they say?">
            <textarea
              className="textarea"
              rows={5}
              value={form.quote}
              onChange={(e) => set("quote", e.target.value)}
            />
          </Field>
          <Field label="Rating">
            <input
              type="number"
              min={1}
              max={5}
              className="input w-24"
              value={form.rating}
              onChange={(e) => set("rating", Number(e.target.value))}
            />
          </Field>
        </Section>
      ) : (
        <Section title="Video">
          <Field label="Video file (mp4)" hint="Stored in Supabase Storage 'videos' bucket.">
            <input
              className="input"
              value={form.video_url}
              onChange={(e) => set("video_url", e.target.value)}
              placeholder="https://…/videos/…"
            />
            <input
              type="file"
              accept="video/mp4,video/webm"
              onChange={(e) => handleUpload(e, "videos", "video")}
              className="mt-2 t-small text-muted"
            />
            {uploading === "video" ? (
              <p className="t-mono text-muted text-xs mt-1">Uploading…</p>
            ) : null}
          </Field>
          <ImageUpload
            label="Thumbnail / poster (optional)"
            aspect="16 / 9"
            value={form.video_thumbnail_url}
            onChange={(url) => set("video_thumbnail_url", url)}
          />
          <Field label="Duration" hint="Format: M:SS (e.g. 1:24)">
            <input
              className="input w-32"
              value={form.duration}
              onChange={(e) => set("duration", e.target.value)}
              placeholder="1:24"
            />
          </Field>
          <Field label="Optional pull-quote">
            <textarea
              className="textarea"
              rows={3}
              value={form.quote}
              onChange={(e) => set("quote", e.target.value)}
            />
          </Field>
        </Section>
      )}

      <Section title="Display">
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Linked project (optional)">
            <select
              className="select"
              value={form.project_id}
              onChange={(e) => set("project_id", e.target.value)}
            >
              <option value="">— None —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Display order">
            <input
              type="number"
              className="input"
              value={form.display_order}
              onChange={(e) => set("display_order", Number(e.target.value) as never)}
            />
          </Field>
          <Field label="Featured?">
            <label className="flex items-center gap-3 mt-1">
              <input
                type="checkbox"
                className="check"
                checked={form.featured}
                onChange={(e) => set("featured", e.target.checked)}
              />
              <span className="t-small text-muted">Show on homepage.</span>
            </label>
          </Field>
        </div>
      </Section>

      {err ? <p className="t-small text-danger">{err}</p> : null}
      {saved ? <p className="t-small text-brand-500">Saved.</p> : null}

      <button
        type="submit"
        disabled={pending || !!uploading}
        className="btn btn-primary disabled:opacity-60"
      >
        <Save className="w-4 h-4" />
        {pending ? "Saving…" : initial?.id ? "Save changes" : "Create review"}
      </button>
    </form>
  );
}
