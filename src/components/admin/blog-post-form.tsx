"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { useUnsavedChanges } from "@/lib/use-unsaved-changes";
import { upsertBlogPostAction } from "@/app/admin/_actions/wrappers";
import type {
  BlogCategoryRow,
  BlogPostRow,
  TeamMemberRow,
} from "@/lib/types/database";
import { slugify } from "@/lib/utils";
import { Field, Section } from "./ui";

export function BlogPostForm({
  initial,
  categories,
  authors,
}: {
  initial?: BlogPostRow;
  categories: BlogCategoryRow[];
  authors: TeamMemberRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState({
    slug: initial?.slug ?? "",
    title: initial?.title ?? "",
    excerpt: initial?.excerpt ?? "",
    body: initial?.body ?? "",
    cover_url: initial?.cover_url ?? "",
    category_id: initial?.category_id ?? "",
    author_id: initial?.author_id ?? "",
    reading_time: initial?.reading_time ?? 0,
    featured: initial?.featured ?? false,
    status: initial?.status ?? ("draft" as const),
    published_at:
      initial?.published_at?.slice(0, 16) ??
      new Date().toISOString().slice(0, 16),
    meta_title: initial?.meta_title ?? "",
    meta_description: initial?.meta_description ?? "",
  });

  const [dirty, setDirty] = useState(false);
  useUnsavedChanges(dirty);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    startTransition(async () => {
      const res = await upsertBlogPostAction({
        id: initial?.id,
        slug: slugify(form.slug),
        title: form.title.trim(),
        excerpt: form.excerpt || undefined,
        body: form.body || undefined,
        cover_url: form.cover_url || undefined,
        category_id: form.category_id || undefined,
        author_id: form.author_id || undefined,
        reading_time: Number(form.reading_time) || undefined,
        featured: form.featured,
        status: form.status,
        published_at: form.published_at
          ? new Date(form.published_at).toISOString()
          : undefined,
        meta_title: form.meta_title || undefined,
        meta_description: form.meta_description || undefined,
      });
      if (!res.ok) {
        setErr(res.error ?? "Could not save.");
        return;
      }
      setDirty(false);
      if (!initial?.id && res.id) router.push(`/admin/blog/posts/${res.id}`);
      else router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Section title="Post">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Title">
            <input
              className="input"
              required
              value={form.title}
              onChange={(e) => {
                set("title", e.target.value);
                if (!initial?.id && !form.slug)
                  set("slug", slugify(e.target.value));
              }}
            />
          </Field>
          <Field label="Slug" hint="URL: /blog/<slug>">
            <input
              className="input"
              required
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
            />
          </Field>
          <Field label="Excerpt" className="md:col-span-2">
            <textarea
              className="textarea"
              rows={2}
              value={form.excerpt}
              onChange={(e) => set("excerpt", e.target.value)}
            />
          </Field>
          <Field label="Body (Markdown)" className="md:col-span-2">
            <textarea
              className="textarea font-mono"
              rows={18}
              value={form.body}
              onChange={(e) => set("body", e.target.value)}
              placeholder={`## Section heading\n\nA paragraph.\n\n### Subheading\n\n> Pull quote.`}
            />
            <p className="t-mono text-muted text-[10px] mt-1.5">
              Supports headings (## / ###), paragraphs, and &gt; blockquotes.
            </p>
          </Field>
          <Field label="Cover image URL">
            <input
              className="input"
              value={form.cover_url}
              onChange={(e) => set("cover_url", e.target.value)}
            />
          </Field>
          <Field label="Reading time (min)">
            <input
              type="number"
              className="input"
              value={form.reading_time}
              onChange={(e) =>
                set("reading_time", Number(e.target.value) as never)
              }
            />
          </Field>
        </div>
      </Section>

      <Section title="Taxonomy">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Category">
            <select
              className="select"
              value={form.category_id}
              onChange={(e) => set("category_id", e.target.value)}
            >
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Author">
            <select
              className="select"
              value={form.author_id}
              onChange={(e) => set("author_id", e.target.value)}
            >
              <option value="">— None —</option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Publish">
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Status">
            <select
              className="select"
              value={form.status}
              onChange={(e) =>
                set("status", e.target.value as "draft" | "published")
              }
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </Field>
          <Field label="Publish date">
            <input
              type="datetime-local"
              className="input"
              value={form.published_at}
              onChange={(e) => set("published_at", e.target.value)}
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
              <span className="t-small text-muted">Hero spot on /blog.</span>
            </label>
          </Field>
        </div>
      </Section>

      <Section title="SEO">
        <Field label="Meta title">
          <input
            className="input"
            value={form.meta_title}
            onChange={(e) => set("meta_title", e.target.value)}
          />
        </Field>
        <Field label="Meta description">
          <textarea
            className="textarea"
            rows={2}
            value={form.meta_description}
            onChange={(e) => set("meta_description", e.target.value)}
          />
        </Field>
      </Section>

      {err ? <p className="t-small text-danger">{err}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary disabled:opacity-60"
      >
        <Save className="w-4 h-4" />
        {pending ? "Saving…" : initial?.id ? "Save changes" : "Create post"}
      </button>
    </form>
  );
}
