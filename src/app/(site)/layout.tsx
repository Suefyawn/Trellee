import { CustomCursor } from "@/components/site/custom-cursor";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Skip-to-content link — invisible until focused. Lets keyboard users
          jump past the nav without tabbing through every link first. */}
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteNav />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
      {/* Desktop-only signature cursor — self-disables on touch + reduced motion */}
      <CustomCursor />
    </>
  );
}
