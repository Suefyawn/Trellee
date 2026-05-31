import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function AdminPageHeader({
  title,
  description,
  back,
  actions,
}: {
  title: string;
  description?: string;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
}) {
  return (
    <div className="border-b border-border bg-surface/30">
      <div className="max-w-[1280px] mx-auto px-8 py-8">
        {back ? (
          <Link
            href={back.href}
            className="t-mono text-muted hover:text-fg transition inline-flex items-center gap-2 mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {back.label}
          </Link>
        ) : null}
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="t-heading-xl font-display">{title}</h1>
            {description ? (
              <p className="t-body text-muted mt-2 max-w-2xl">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      </div>
    </div>
  );
}

export function AdminPageBody({ children }: { children: React.ReactNode }) {
  return <div className="max-w-[1280px] mx-auto px-8 py-8">{children}</div>;
}
