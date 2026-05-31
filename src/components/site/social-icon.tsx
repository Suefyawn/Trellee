import { Github, Instagram, Linkedin, Twitter, Youtube, Globe } from "lucide-react";

export function SocialIcon({
  platform,
  className,
}: {
  platform: string;
  className?: string;
}) {
  const p = platform.toLowerCase();
  // X (Twitter) gets a custom SVG since lucide's "x" icon is the close icon
  if (p === "x" || p === "twitter") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-hidden
      >
        <path d="M18.244 2H21.5l-7.4 8.46L23 22h-6.86l-5.37-7.02L4.6 22H1.34l7.92-9.05L1 2h7.03l4.85 6.41L18.24 2zm-2.4 18h1.91L7.27 4H5.24l10.6 16z" />
      </svg>
    );
  }
  if (p === "linkedin") return <Linkedin className={className} />;
  if (p === "github") return <Github className={className} />;
  if (p === "instagram") return <Instagram className={className} />;
  if (p === "youtube") return <Youtube className={className} />;
  return <Globe className={className} />;
}
