import { ImageResponse } from "next/og";
import { getSiteSettings } from "@/lib/cms";

export const alt = "Trellee · Full-stack digital agency";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default async function OpengraphImage() {
  // Keep the share card in sync with the hero's booking line. Fall back to
  // sensible defaults so the image always renders even if the fetch fails.
  let quarter = "Q3 2026";
  let slots = 4;
  try {
    const s = await getSiteSettings();
    if (s?.booking_quarter) quarter = s.booking_quarter;
    if (typeof s?.booking_slots_open === "number" && s.booking_slots_open > 0) {
      slots = s.booking_slots_open;
    }
  } catch {
    /* defaults */
  }

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
          backgroundColor: "#07090c",
          backgroundImage:
            "radial-gradient(circle at 15% 15%, rgba(80,210,160,0.18), transparent 55%), radial-gradient(circle at 85% 85%, rgba(60,170,140,0.10), transparent 60%)",
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

        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
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
            ── Full-stack digital agency
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 92,
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: "-4px",
              maxWidth: "1000px",
            }}
          >
            <span>We build the systems</span>
            <span>your business runs on.</span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              color: "#a8aeb6",
              maxWidth: "900px",
              lineHeight: 1.4,
            }}
          >
            Design, code, and growth, built in one team. From the first commit to the first conversion.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 20,
            color: "#7e8590",
            fontFamily: "ui-monospace, monospace",
            letterSpacing: "1px",
          }}
        >
          <span>trellee.com</span>
          <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "999px",
                background: "#4ed5a8",
                display: "flex",
              }}
            />
            Booking {quarter} · {slots} slots open
          </span>
        </div>
      </div>
    ),
    size,
  );
}
