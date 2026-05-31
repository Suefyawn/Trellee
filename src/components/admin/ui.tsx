"use client";

import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="t-mono text-muted text-xs">{label}</span>
      <div className="mt-2">{children}</div>
      {hint ? <p className="t-mono text-muted text-[10px] mt-1.5">{hint}</p> : null}
    </label>
  );
}

export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="surface-card p-6 lg:p-8">
      <h2 className="t-heading-l font-display">{title}</h2>
      {description ? (
        <p className="t-small text-muted mt-2 max-w-2xl">{description}</p>
      ) : null}
      <div className="mt-6 space-y-5">{children}</div>
    </div>
  );
}
