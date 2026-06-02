export default function BlogLoading() {
  return (
    <div className="max-w-[1280px] mx-auto px-6 lg:px-10 pt-24 pb-32 animate-pulse">
      <div className="h-10 w-56 max-w-full rounded bg-surface-2/60" />
      <div className="mt-4 h-4 w-80 max-w-full rounded bg-surface-2/40" />
      <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="surface-card overflow-hidden">
            <div className="aspect-[16/9] bg-surface-2/50" />
            <div className="p-6 space-y-2">
              <div className="h-4 w-48 rounded bg-surface-2/50" />
              <div className="h-3 w-2/3 rounded bg-surface-2/40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
