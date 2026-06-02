"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { useUnsavedChanges } from "@/lib/use-unsaved-changes";
import { upsertProjectAction } from "@/app/admin/_actions/wrappers";
import type { ProjectRow, ServiceRow } from "@/lib/types/database";
import { slugify } from "@/lib/utils";
import { Field, Section } from "./ui";
import { JsonListEditor } from "./json-list-editor";
import { ImageUpload } from "./image-upload";

export function ProjectForm({
  initial,
  services,
}: {
  initial?: ProjectRow;
  services: ServiceRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    slug: initial?.slug ?? "",
    title: initial?.title ?? "",
    client_name: initial?.client_name ?? "",
    summary: initial?.summary ?? "",
    hero_eyebrow: initial?.hero_eyebrow ?? "CASE STUDY",
    brief: initial?.brief ?? "",
    approach: initial?.approach ?? "",
    outcome: initial?.outcome ?? "",
    cover_url: initial?.cover_url ?? "",
    thumbnail_url: initial?.thumbnail_url ?? "",
    featured: initial?.featured ?? false,
    featured_order: initial?.featured_order ?? 0,
    status: initial?.status ?? ("draft" as const),
    meta_title: initial?.meta_title ?? "",
    meta_description: initial?.meta_description ?? "",
  });

  const [serviceCategories, setServiceCategories] = useState<string[]>(
    initial?.service_categories ?? [],
  );
  const [metrics, setMetrics] = useState(initial?.metrics ?? []);
  const [technologies, setTechnologies] = useState(initial?.technologies ?? []);
  const [gallery, setGallery] = useState(initial?.gallery ?? []);

  const [dirty, setDirty] = useState(false);
  useUnsavedChanges(dirty);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  }

  function toggleCategory(slug: string) {
    setServiceCategories((arr) =>
      arr.includes(slug) ? arr.filter((s) => s !== slug) : [...arr, slug],
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaved(false);
    startTransition(async () => {
      const res = await upsertProjectAction({
        id: initial?.id,
        slug: slugify(form.slug),
        title: form.title.trim(),
        client_name: form.client_name || undefined,
        summary: form.summary || undefined,
        hero_eyebrow: form.hero_eyebrow || undefined,
        brief: form.brief || undefined,
        approach: form.approach || undefined,
        outcome: form.outcome || undefined,
        cover_url: form.cover_url || undefined,
        thumbnail_url: form.thumbnail_url || undefined,
        gallery,
        metrics,
        technologies,
        service_categories: serviceCategories,
        featured: form.featured,
        featured_order: Number(form.featured_order) || 0,
        status: form.status,
        meta_title: form.meta_title || undefined,
        meta_description: form.meta_description || undefined,
      });
      if (!res.ok) {
        setErr(res.error ?? "Could not save.");
        return;
      }
      setSaved(true);
      setDirty(false);
      if (!initial?.id && res.id) router.push(`/admin/projects/${res.id}`);
      else router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Section title="Basics">
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
          <Field label="Slug" hint="URL: /portfolio/<slug>">
            <input
              className="input"
              required
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
            />
          </Field>
          <Field label="Client name">
            <input
              className="input"
              value={form.client_name}
              onChange={(e) => set("client_name", e.target.value)}
            />
          </Field>
          <Field label="Hero eyebrow" hint="Default: CASE STUDY">
            <input
              className="input"
              value={form.hero_eyebrow}
              onChange={(e) => set("hero_eyebrow", e.target.value)}
            />
          </Field>
          <Field label="Summary" className="md:col-span-2">
            <textarea
              className="textarea"
              rows={3}
              value={form.summary}
              onChange={(e) => set("summary", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Service categories"
        description="Which services this project demonstrates. Drives /services and /portfolio filtering."
      >
        <div className="flex flex-wrap gap-2">
          {services.map((s) => {
            const sel = serviceCategories.includes(s.slug);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleCategory(s.slug)}
                className={`px-3 py-1.5 rounded-md t-mono text-xs border transition ${
                  sel
                    ? "bg-brand-500/20 border-brand-500/50 text-fg"
                    : "border-border text-muted hover:text-fg hover:border-border-strong"
                }`}
              >
                {s.short_title ?? s.title}
              </button>
            );
          })}
        </div>
      </Section>

      <Section
        title="Case study sections"
        description="The brief, the approach, the outcome — what the case study tells."
      >
        <Field label="The brief">
          <textarea
            className="textarea"
            rows={4}
            value={form.brief}
            onChange={(e) => set("brief", e.target.value)}
          />
        </Field>
        <Field label="The approach">
          <textarea
            className="textarea"
            rows={4}
            value={form.approach}
            onChange={(e) => set("approach", e.target.value)}
          />
        </Field>
        <Field label="The outcome / results">
          <textarea
            className="textarea"
            rows={4}
            value={form.outcome}
            onChange={(e) => set("outcome", e.target.value)}
          />
        </Field>
      </Section>

      <Section title="Metrics" description="Up to 4 outcome numbers shown in the hero.">
        <JsonListEditor
          fields={[
            { key: "label", label: "Label", type: "text" },
            { key: "value", label: "Value", type: "text", placeholder: "−47%" },
            { key: "context", label: "Context", type: "text" },
          ]}
          value={metrics}
          onChange={setMetrics}
          newItem={{ label: "", value: "", context: "" }}
          emptyLabel="Add metric"
        />
      </Section>

      <Section title="Technology stack" description="Grouped by category on the case study page.">
        <JsonListEditor
          fields={[
            { key: "name", label: "Name", type: "text", placeholder: "Next.js" },
            { key: "category", label: "Category", type: "text", placeholder: "Frontend" },
          ]}
          value={technologies}
          onChange={setTechnologies}
          newItem={{ name: "", category: "" }}
          emptyLabel="Add technology"
        />
      </Section>

      <Section title="Gallery" description="Screenshots or mockup images shown below the hero.">
        <JsonListEditor
          fields={[
            { key: "url", label: "Image URL", type: "text" },
            { key: "caption", label: "Caption (optional)", type: "text" },
          ]}
          value={gallery}
          onChange={setGallery}
          newItem={{ url: "", caption: "", type: "image" }}
          emptyLabel="Add image"
        />
      </Section>

      <Section title="Media + assets">
        <div className="grid md:grid-cols-2 gap-5">
          <ImageUpload
            label="Cover image"
            aspect="16 / 10"
            hint="Shown as the hero on the case study"
            value={form.cover_url}
            onChange={(url) => set("cover_url", url)}
          />
          <ImageUpload
            label="Thumbnail"
            aspect="16 / 10"
            hint="Used in listings / cards"
            value={form.thumbnail_url}
            onChange={(url) => set("thumbnail_url", url)}
          />
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
          <Field label="Featured?">
            <label className="flex items-center gap-3 mt-1">
              <input
                type="checkbox"
                className="check"
                checked={form.featured}
                onChange={(e) => set("featured", e.target.checked)}
              />
              <span className="t-small text-muted">Show in homepage work section.</span>
            </label>
          </Field>
          <Field label="Featured order">
            <input
              type="number"
              className="input"
              value={form.featured_order}
              onChange={(e) =>
                set("featured_order", Number(e.target.value) as never)
              }
            />
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
      {saved ? <p className="t-small text-brand-500">Saved.</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary disabled:opacity-60"
      >
        <Save className="w-4 h-4" />
        {pending ? "Saving…" : initial?.id ? "Save changes" : "Create project"}
      </button>
    </form>
  );
}
