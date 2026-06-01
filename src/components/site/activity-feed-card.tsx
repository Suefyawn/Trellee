import type { ActivityFeedRow } from "@/lib/types/database";

/**
 * Relative "time ago" for the live build log. Reads as genuinely recent
 * ("2d ago") instead of a fixed clock time, and falls back to a short date
 * once an entry is more than a few weeks old. Computed at build/render time.
 */
function timeAgo(iso: string) {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const min = Math.round(diff / 60000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  const wk = Math.round(day / 7);
  if (wk <= 4) return `${wk}w ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function ActivityFeedCard({ items }: { items: ActivityFeedRow[] }) {
  return (
    <div className="surface-card p-5 lg:p-6">
      <div className="flex items-center justify-between">
        <span className="mono-tag" style={{ color: "var(--color-muted)" }}>
          Build log · live
        </span>
        <span className="flex items-center gap-2 text-xs t-mono text-muted">
          <span className="live-dot" /> live
        </span>
      </div>
      <ul className="mt-5 space-y-3 t-small">
        {items.slice(0, 4).map((item) => (
          <li key={item.id} className="flex items-start gap-3">
            <span className="t-mono text-muted text-xs w-16 flex-shrink-0 pt-0.5">
              {timeAgo(item.occurred_at)}
            </span>
            <span className="flex-1">{item.message}</span>
            {item.badge ? (
              <span className="badge text-[10px]">{item.badge}</span>
            ) : null}
          </li>
        ))}
      </ul>
      <div className="mt-5 pt-4 border-t border-border flex items-center justify-between t-small">
        <span className="text-muted">All systems</span>
        <span className="font-mono text-brand-500">operational</span>
      </div>
    </div>
  );
}
