/**
 * Branded placeholder visual for blog/field-note cards that don't have a photo.
 * Reads as an intentional editorial cover (brand grid + mesh + the category
 * label) rather than an empty gradient box.
 */
export function PostCover({
  label,
  className,
}: {
  label?: string | null;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-surface-2 ${className ?? ""}`}>
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="mesh opacity-70" />
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <span className="font-display text-2xl lg:text-3xl text-muted/40 text-center tracking-tight">
          {label ?? "Field notes"}
        </span>
      </div>
    </div>
  );
}
