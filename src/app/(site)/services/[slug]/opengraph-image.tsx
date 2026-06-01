import { getServiceBySlug } from "@/lib/cms";
import { ogImage } from "@/lib/og";

export const alt = "Trellee service";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  return ogImage({
    eyebrow: "SERVICE",
    title: service?.title ?? "What we do",
  });
}
