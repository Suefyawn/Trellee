/**
 * Instant skeleton shown while an admin page's server component is fetching.
 * Renders immediately on navigation (and via Link prefetch), so clicks feel
 * responsive instead of hanging on the DB round-trip. The sidebar (in the
 * shell layout) stays put; only this page region swaps.
 */
export default function AdminLoading() {
  return (
    <div className="animate-pulse">
      {/* Header band — mirrors AdminPageHeader */}
      <div className="border-b border-border bg-surface/30">
        <div className="max-w-[1280px] mx-auto px-8 py-8">
          <div className="h-7 w-56 rounded bg-surface-2" />
          <div className="mt-3 h-4 w-80 max-w-full rounded bg-surface-2/60" />
        </div>
      </div>
      {/* Body — mirrors AdminPageBody */}
      <div className="max-w-[1280px] mx-auto px-8 py-8 space-y-3">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-surface-2/50" />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-surface-2/40" />
        ))}
      </div>
    </div>
  );
}
