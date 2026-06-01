import { getBlogPostBySlug } from "@/lib/cms";
import { ogImage } from "@/lib/og";

export const alt = "Trellee field notes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  return ogImage({
    eyebrow: "FIELD NOTES",
    title: post?.title ?? "Field notes",
  });
}
