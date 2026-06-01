import { ImageResponse } from "next/og";

/**
 * Shared 1200×630 social card, matching the site's dark + teal brand. Used by
 * the per-entity opengraph-image routes (case studies, services, posts) so a
 * shared link shows its own title instead of the generic site card.
 */
export function ogImage({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background:
            "radial-gradient(circle at 15% 15%, rgba(80,210,160,0.18), transparent 55%), radial-gradient(circle at 85% 85%, rgba(60,170,140,0.10), transparent 60%), #07090c",
          color: "#f5f6f7",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: 36,
            fontWeight: 800,
            letterSpacing: "-2px",
          }}
        >
          <span>TRELLEE</span>
          <span style={{ color: "#4ed5a8" }}>.</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              color: "#7e8590",
              letterSpacing: "2px",
              textTransform: "uppercase",
              fontFamily: "ui-monospace, monospace",
            }}
          >
            ── {eyebrow}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: title.length > 48 ? 60 : 76,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-3px",
              maxWidth: "1040px",
            }}
          >
            {title}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
