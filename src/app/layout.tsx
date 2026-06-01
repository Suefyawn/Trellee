import type { Metadata } from "next";
import "./globals.css";
import { PostHogProvider } from "@/components/analytics/posthog-provider";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const siteName = "Trellee";
const description =
  "Trellee is a full-stack digital agency. We design brands, ship code, run ads, and build the systems your business runs on, all from one team.";

export const metadata: Metadata = {
  title: {
    default: `${siteName} · Full-stack digital agency`,
    template: `%s · ${siteName}`,
  },
  description,
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  authors: [{ name: siteName, url: siteUrl }],
  creator: siteName,
  publisher: siteName,
  keywords: [
    "digital agency",
    "custom CRM",
    "web development",
    "mobile apps",
    "lead generation",
    "AI solutions",
    "Miami agency",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName,
    title: `${siteName} · Full-stack digital agency`,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} · Full-stack digital agency`,
    description,
    creator: "@trellee",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Cabinet Grotesk is the site-wide sans (body + display). Geist Mono
            is used for monospace accents — timestamps, badges, code, mono tags. */}
        <link
          href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@300,400,500,600,700,800,900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-bg text-fg antialiased">
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
