import type { ActivityFeedRow } from "@/lib/types/database";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
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
            <span className="t-mono text-muted text-xs w-12 flex-shrink-0 pt-0.5">
              {formatTime(item.occurred_at)}
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
