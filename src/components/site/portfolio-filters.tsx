import Link from "next/link";
import type { ServiceRow } from "@/lib/types/database";

export function PortfolioFilters({
  services,
  active,
}: {
  services: ServiceRow[];
  active?: string;
}) {
  return (
    <section className="py-5 border-y border-border sticky top-16 z-30 backdrop-blur-md bg-bg/80">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <Link
            href="/portfolio"
            className={`px-3 py-1.5 rounded-md t-mono text-xs whitespace-nowrap transition ${
              !active
                ? "bg-fg text-bg"
                : "text-muted hover:text-fg hover:bg-surface-2"
            }`}
          >
            All work
          </Link>
          {services.map((s) => (
            <Link
              key={s.id}
              href={`/portfolio?category=${s.slug}`}
              className={`px-3 py-1.5 rounded-md t-mono text-xs whitespace-nowrap transition ${
                active === s.slug
                  ? "bg-fg text-bg"
                  : "text-muted hover:text-fg hover:bg-surface-2"
              }`}
            >
              {s.short_title ?? s.title}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
