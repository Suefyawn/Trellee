import Link from "next/link";
import { ArrowUpRight, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Page not found",
  description:
    "We can't find the page you're looking for. Try one of these instead.",
  robots: { index: false, follow: false },
};

/**
 * 404 — on-brand, with quick links to the most common destinations so users
 * don't bounce. Reuses the same kinetic display + mesh background as the rest
 * of the site so it doesn't feel like a fallback page.
 */
export default function NotFound() {
  return (
    <main className="relative min-h-[80vh] grid place-items-center overflow-hidden px-6 py-24">
      {/* Mesh + grid background — same as hero sections for consistency */}
      <div className="mesh absolute inset-0 pointer-events-none" />
      <div className="grid-bg absolute inset-0 pointer-events-none" />

      <div className="relative max-w-2xl w-full text-center">
        {/* Big 404 numeral with the same gradient-text treatment as process numbers */}
        <div
          aria-hidden
          className="step-num leading-none"
          style={{ fontSize: "clamp(7rem, 18vw, 13rem)" }}
        >
          404
        </div>

        <span className="mono-tag justify-center mt-4">
          Lost · let&apos;s reroute
        </span>

        <h1 className="t-display-l mt-5 font-display">
          That page didn&apos;t ship.
        </h1>

        <p className="t-body-l text-muted mt-4 max-w-md mx-auto">
          Either the URL is wrong, the page moved, or we never got around to
          building it. Try one of these instead:
        </p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <Link
            href="/services"
            className="surface-card surface-card-hover p-4 group"
          >
            <span className="mono-tag">01</span>
            <div className="mt-2 flex items-center justify-between">
              <span className="t-body font-medium">Services</span>
              <ArrowUpRight className="w-4 h-4 text-muted group-hover:text-fg transition" />
            </div>
            <p className="t-small text-muted mt-1">
              Ten disciplines, one team.
            </p>
          </Link>
          <Link
            href="/portfolio"
            className="surface-card surface-card-hover p-4 group"
          >
            <span className="mono-tag">02</span>
            <div className="mt-2 flex items-center justify-between">
              <span className="t-body font-medium">Work</span>
              <ArrowUpRight className="w-4 h-4 text-muted group-hover:text-fg transition" />
            </div>
            <p className="t-small text-muted mt-1">
              Recent ships, with receipts.
            </p>
          </Link>
          <Link
            href="/book"
            className="surface-card surface-card-hover p-4 group"
          >
            <span className="mono-tag">03</span>
            <div className="mt-2 flex items-center justify-between">
              <span className="t-body font-medium">Book a call</span>
              <ArrowUpRight className="w-4 h-4 text-muted group-hover:text-fg transition" />
            </div>
            <p className="t-small text-muted mt-1">
              30 minutes. No prep needed.
            </p>
          </Link>
        </div>

        <div className="mt-10 flex items-center justify-center gap-3">
          <Link href="/" className="btn btn-primary">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>
          <Link href="/contact" className="btn btn-ghost">
            Or report a broken link
          </Link>
        </div>
      </div>
    </main>
  );
}
