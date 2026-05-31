"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { upsertServiceAction } from "@/app/admin/_actions/wrappers";
import type { ServiceRow } from "@/lib/types/database";
import { slugify } from "@/lib/utils";
import { Field, Section } from "./ui";
import { JsonListEditor } from "./json-list-editor";

const TILE_SIZES = ["sm", "md", "lg", "xl"] as const;

export function ServiceForm({ initial }: { initial?: ServiceRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    slug: initial?.slug ?? "",
    title: initial?.title ?? "",
    short_title: initial?.short_title ?? "",
    icon: initial?.icon ?? "",
    category: initial?.category ?? "",
    tags: (initial?.tags ?? []).join(", "),
    tile_size: initial?.tile_size ?? ("md" as const),
    featured: initial?.featured ?? false,
    display_order: initial?.display_order ?? 0,
    hero_snippet: initial?.hero_snippet ?? "",
    summary: initial?.summary ?? "",
    problem_statement: initial?.problem_statement ?? "",
    hero_code: initial?.hero_code ?? "",
    hero_code_lang: initial?.hero_code_lang ?? "typescript",
    meta_title: initial?.meta_title ?? "",
    meta_description: initial?.meta_description ?? "",
  });

  const [approachPillars, setApproachPillars] = useState(
    initial?.approach_pillars ?? [],
  );
  const [deliverables, setDeliverables] = useState(initial?.deliverables ?? []);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaved(false);
    startTransition(async () => {
      const res = await upsertServiceAction({
        id: initial?.id,
        slug: slugify(form.slug),
        title: form.title.trim(),
        short_title: form.short_title.trim() || undefined,
        icon: form.icon.trim() || undefined,
        category: form.category.trim() || undefined,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        tile_size: form.tile_size,
        featured: form.featured,
        display_order: Number(form.display_order) || 0,
        hero_snippet: form.hero_snippet.trim() || undefined,
        summary: form.summary.trim() || undefined,
        problem_statement: form.problem_statement.trim() || undefined,
        approach_pillars: approachPillars,
        deliverables,
        hero_code: form.hero_code || undefined,
        hero_code_lang: form.hero_code_lang.trim() || undefined,
        meta_title: form.meta_title.trim() || undefined,
        meta_description: form.meta_description.trim() || undefined,
      });
      if (!res.ok) {
        setErr(res.error ?? "Could not save.");
        return;
      }
      setSaved(true);
      if (!initial?.id && res.id) {
        router.push(`/admin/services/${res.id}`);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Section title="Basics" description="What this service is and how it's tagged.">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Title">
            <input
              className="input"
              required
              value={form.title}
              onChange={(e) => {
                set("title", e.target.value);
                if (!initial?.id && !form.slug) set("slug", slugify(e.target.value));
              }}
            />
          </Field>
          <Field label="Slug" hint="URL: /services/<slug>">
            <input
              className="input"
              required
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
            />
          </Field>
          <Field label="Short title" hint="Used on bento tile.">
            <input
              className="input"
              value={form.short_title}
              onChange={(e) => set("short_title", e.target.value)}
            />
          </Field>
          <Field label="Lucide icon name" hint="e.g. Database, Code2, Sparkles">
            <input
              className="input"
              value={form.icon}
              onChange={(e) => set("icon", e.target.value)}
            />
          </Field>
          <Field label="Category" hint="e.g. Engineering, Growth, Design">
            <input
              className="input"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            />
          </Field>
          <Field label="Tags" hint="Comma-separated badges shown on tile.">
            <input
              className="input"
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Homepage tile"
        description="How this service appears in the bento grid + ordering."
      >
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Tile size">
            <select
              className="select"
              value={form.tile_size}
              onChange={(e) =>
                set("tile_size", e.target.value as (typeof TILE_SIZES)[number])
              }
            >
              {TILE_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s.toUpperCase()}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Display order">
            <input
              type="number"
              className="input"
              value={form.display_order}
              onChange={(e) =>
                set("display_order", Number(e.target.value) as never)
              }
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
              <span className="t-small text-muted">Show on homepage bento.</span>
            </label>
          </Field>
        </div>
      </Section>

      <Section
        title="Detail page copy"
        description="Hero, problem, and summary text on the /services/[slug] page."
      >
        <Field label="Hero snippet" hint="Big subtitle under the title.">
          <input
            className="input"
            value={form.hero_snippet}
            onChange={(e) => set("hero_snippet", e.target.value)}
          />
        </Field>
        <Field label="Summary" hint="Short paragraph used on listings.">
          <textarea
            className="textarea"
            rows={3}
            value={form.summary}
            onChange={(e) => set("summary", e.target.value)}
          />
        </Field>
        <Field label="Problem statement" hint="The 'the problem' section.">
          <textarea
            className="textarea"
            rows={4}
            value={form.problem_statement}
            onChange={(e) => set("problem_statement", e.target.value)}
          />
        </Field>
      </Section>

      <Section
        title="Approach pillars"
        description="3 principles shown on the detail page."
      >
        <JsonListEditor
          fields={[
            { key: "title", label: "Title", type: "text" },
            { key: "description", label: "Description", type: "textarea" },
            { key: "icon", label: "Icon (Lucide)", type: "text" },
          ]}
          value={approachPillars}
          onChange={setApproachPillars}
          newItem={{ title: "", description: "", icon: "" }}
          emptyLabel="Add a pillar"
        />
      </Section>

      <Section
        title="Deliverables"
        description="What the client receives — shows on detail page in a grid."
      >
        <JsonListEditor
          fields={[
            { key: "title", label: "Title", type: "text" },
            { key: "description", label: "Description", type: "textarea" },
            { key: "icon", label: "Icon (Lucide)", type: "text" },
          ]}
          value={deliverables}
          onChange={setDeliverables}
          newItem={{ title: "", description: "", icon: "" }}
          emptyLabel="Add a deliverable"
        />
      </Section>

      <Section
        title="Hero code window (optional)"
        description="A short code snippet shown in the hero, for engineering-flavored services."
      >
        <Field label="Language" hint="e.g. typescript, python, sql">
          <input
            className="input"
            value={form.hero_code_lang}
            onChange={(e) => set("hero_code_lang", e.target.value)}
          />
        </Field>
        <Field label="Code">
          <textarea
            className="textarea font-mono text-xs"
            rows={8}
            value={form.hero_code}
            onChange={(e) => set("hero_code", e.target.value)}
          />
        </Field>
      </Section>

      <Section title="SEO" description="Overrides the default title/description.">
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
      {saved ? (
        <p className="t-small text-brand-500">Saved.</p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {pending ? "Saving…" : initial?.id ? "Save changes" : "Create service"}
        </button>
      </div>
    </form>
  );
}
