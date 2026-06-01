import type { MetadataRoute } from "next";

/**
 * Web app manifest — makes the site installable as a PWA and gives the
 * mobile browser chrome the right name, colors, and icons. Served at
 * /manifest.webmanifest and linked automatically by Next.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Trellee · Full-stack digital agency",
    short_name: "Trellee",
    description:
      "Trellee is a full-stack digital agency. We design brands, ship code, run ads, and build the systems your business runs on.",
    start_url: "/",
    display: "standalone",
    background_color: "#06070a",
    theme_color: "#06070a",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
