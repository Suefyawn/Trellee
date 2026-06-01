import { getProjectBySlug } from "@/lib/cms";
import { ogImage } from "@/lib/og";

export const alt = "Trellee case study";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  return ogImage({
    eyebrow: project?.hero_eyebrow ?? "CASE STUDY",
    title: project?.title ?? "Case study",
  });
}
