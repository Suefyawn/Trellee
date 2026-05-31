import type { MetadataRoute } from "next";
import {
  getBlogPosts,
  getProjects,
  getServices,
} from "@/lib/cms";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, projects, posts] = await Promise.all([
    getServices(),
    getProjects(),
    getBlogPosts(),
  ]);

  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/services`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/portfolio`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/book`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];

  const serviceEntries: MetadataRoute.Sitemap = services.map((s) => ({
    url: `${SITE_URL}/services/${s.slug}`,
    lastModified: new Date(s.updated_at),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const projectEntries: MetadataRoute.Sitemap = projects.map((p) => ({
    url: `${SITE_URL}/portfolio/${p.slug}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const postEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticEntries, ...serviceEntries, ...projectEntries, ...postEntries];
}
