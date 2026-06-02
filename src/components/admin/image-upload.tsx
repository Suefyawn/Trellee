"use client";

import { useRef, useState } from "react";
import { UploadCloud, X, Loader2, Link as LinkIcon } from "lucide-react";
import { uploadAsset } from "@/app/admin/_actions/reviews";
import { cn } from "@/lib/utils";

const MAX_MB = 6;

/** Encode a File to base64 in chunks (avoids call-stack overflow on big files). */
async function fileToBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * Drag-and-drop image upload with preview. Uploads to the public `media`
 * bucket via the owner-guarded uploadAsset action and reports the public URL
 * through onChange. Keeps a "paste URL" fallback for external images.
 */
export function ImageUpload({
  value,
  onChange,
  label,
  hint,
  aspect = "16 / 10",
  rounded = false,
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  aspect?: string;
  rounded?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [showUrl, setShowUrl] = useState(false);

  async function handleFile(file?: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErr("Please choose an image file.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setErr(`Image must be under ${MAX_MB}MB.`);
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      const base64 = await fileToBase64(file);
      const res = await uploadAsset({
        bucket: "media",
        filename: file.name,
        contentType: file.type || "image/jpeg",
        base64,
      });
      if (res.ok) onChange(res.url);
      else setErr(res.error);
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {label ? <span className="t-mono text-muted text-xs">{label}</span> : null}
      <div
        className={cn(
          "mt-2 relative overflow-hidden border border-dashed transition",
          rounded ? "rounded-full w-28 h-28 mx-auto" : "rounded-lg",
          drag ? "border-brand-500 bg-brand-500/5" : "border-border bg-surface-2/30",
        )}
        style={value && !rounded ? { aspectRatio: aspect } : undefined}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          void handleFile(e.dataTransfer.files?.[0]);
        }}
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 bg-bg/70 backdrop-blur-sm transition">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="btn btn-secondary btn-sm"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => onChange("")}
                className="btn btn-secondary btn-sm"
                aria-label="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-2 py-7 px-4 text-muted hover:text-fg transition"
          >
            {busy ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
            <span className="t-small text-center">
              {busy ? "Uploading…" : "Drag & drop or click to upload"}
            </span>
            <span className="t-mono text-[10px]">PNG · JPG · WEBP · up to {MAX_MB}MB</span>
          </button>
        )}
        {busy && value ? (
          <div className="absolute inset-0 grid place-items-center bg-bg/60">
            <Loader2 className="w-6 h-6 animate-spin text-fg" />
          </div>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <div className="mt-1.5 flex items-center justify-between gap-2">
        <p className="t-mono text-muted text-[10px]">{hint}</p>
        <button
          type="button"
          onClick={() => setShowUrl((s) => !s)}
          className="t-mono text-muted text-[10px] hover:text-fg inline-flex items-center gap-1 shrink-0"
        >
          <LinkIcon className="w-3 h-3" />
          {showUrl ? "hide URL" : "or paste URL"}
        </button>
      </div>
      {showUrl ? (
        <input
          type="url"
          className="input mt-1"
          value={value}
          placeholder="https://…"
          onChange={(e) => onChange(e.target.value)}
        />
      ) : null}
      {err ? <p className="t-small text-danger mt-1">{err}</p> : null}
    </div>
  );
}
