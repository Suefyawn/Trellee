"use client";

import Script from "next/script";

/**
 * GA4 tag — only loads when NEXT_PUBLIC_GA4_ID is set. Lets you "link GA4"
 * later by setting one env var, with no code change. PostHog stays the primary
 * analytics; this runs alongside it for Google's channel/Ads data.
 */
export function GoogleAnalytics() {
  const id = process.env.NEXT_PUBLIC_GA4_ID;
  if (!id) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${id}');`}
      </Script>
    </>
  );
}
