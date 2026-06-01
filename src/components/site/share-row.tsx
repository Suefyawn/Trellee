"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { SocialIcon } from "./social-icon";

/** Share controls for a blog post: X, LinkedIn, and copy-link. */
export function ShareRow({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const x = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    title,
  )}&url=${encodeURIComponent(url)}`;
  const linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    url,
  )}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — no-op */
    }
  }

  const cls =
    "w-9 h-9 rounded-md border border-border bg-surface flex items-center justify-center text-muted hover:text-fg hover:border-border-strong transition";

  return (
    <div className="flex items-center gap-2">
      <span className="t-mono text-muted text-xs mr-1">Share</span>
      <a href={x} target="_blank" rel="noopener noreferrer" aria-label="Share on X" className={cls}>
        <SocialIcon platform="x" className="w-4 h-4" />
      </a>
      <a
        href={linkedin}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
        className={cls}
      >
        <SocialIcon platform="linkedin" className="w-4 h-4" />
      </a>
      <button type="button" onClick={copy} aria-label="Copy link" className={cls}>
        {copied ? <Check className="w-4 h-4 text-brand-500" /> : <Link2 className="w-4 h-4" />}
      </button>
    </div>
  );
}
