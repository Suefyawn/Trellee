"use client";

import { useRef, useState } from "react";
import { UploadCloud, X, Loader2, GripVertical } from "lucide-react";
import type { ProjectGalleryItem } from "@/lib/types/database";
import { uploadImageFile, MAX_UPLOAD_MB } from "@/lib/upload-client";
import { cn } from "@/lib/utils";

/**
 * Multi-image gallery editor: drop or pick several images at once (uploaded to
 * the media bucket), edit captions, reorder by drag, and remove. Falls back to
 * pasting a URL for an individual row.
 */
export function GalleryUpload({
  value,
  onChange,
}: {
  value: ProjectGalleryItem[];
  onChange: (items: ProjectGalleryItem[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  async function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setErr(null);
    setBusy(true);
    const added: ProjectGalleryItem[] = [];
    for (const file of Array.from(files)) {
      const res = await uploadImageFile(file);
      if (res.ok) added.push({ url: res.url, caption: "", type: "image" });
      else setErr(res.error);
    }
    if (added.length) onChange([...value, ...added]);
    setBusy(false);
  }

  function update(i: number, patch: Partial<ProjectGalleryItem>) {
    onChange(value.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  function reorder(from: number, to: number) {
    if (from === to) return;
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  return (
    <div>
      {value.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          {value.map((item, i) => (
            <div
              key={i}
              draggable
              onDragStart={() => setDragIdx(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIdx !== null) reorder(dragIdx, i);
                setDragIdx(null);
              }}
              className="surface-card p-2 flex gap-3 items-start"
            >
              <GripVertical className="w-4 h-4 text-muted mt-8 cursor-grab shrink-0" />
              <div className="relative w-24 h-16 rounded overflow-hidden bg-surface-2 shrink-0">
                {item.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt="" className="w-full h-full object-cover" />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <input
                  className="input"
                  placeholder="Caption (optional)"
                  value={item.caption ?? ""}
                  onChange={(e) => update(i, { caption: e.target.value })}
                />
                <input
                  className="input mt-1.5 t-mono text-[11px]"
                  placeholder="https://… (or upload)"
                  value={item.url}
                  onChange={(e) => update(i, { url: e.target.value })}
                />
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                className="p-1 rounded text-muted hover:text-danger hover:bg-surface-2 transition shrink-0"
                aria-label="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div
        className={cn(
          "rounded-lg border border-dashed transition",
          drag ? "border-brand-500 bg-brand-500/5" : "border-border bg-surface-2/30",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          void addFiles(e.dataTransfer.files);
        }}
      >
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-2 py-6 px-4 text-muted hover:text-fg transition"
        >
          {busy ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <UploadCloud className="w-6 h-6" />
          )}
          <span className="t-small">
            {busy ? "Uploading…" : "Drag & drop images, or click to add several"}
          </span>
          <span className="t-mono text-[10px]">PNG · JPG · WEBP · up to {MAX_UPLOAD_MB}MB each</span>
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          void addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {err ? <p className="t-small text-danger mt-1">{err}</p> : null}
    </div>
  );
}
