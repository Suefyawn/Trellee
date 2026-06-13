import type { MetadataRoute } from "next";
import {
  getBlogPosts,
  getProjects,
  getServices,
} from "@/lib/cms";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, projects, posts] = await Promise.all([
    getServices(),
    getProjects(),
    getBlogPosts(),
  ]);

  // Derive lastModified from real content timestamps rather than the build time
  // (`new Date()`), which would falsely signal that every page changed on every
  // regeneration.
  const newest = (dates: (string | null | undefined)[]) => {
    const ts = dates
      .map((d) => (d ? new Date(d).getTime() : 0))
      .filter(Boolean);
    return ts.length ? new Date(Math.max(...ts)) : new Date();
  };
  const servicesUpdated = newest(services.map((s) => s.updated_at));
  const projectsUpdated = newest(projects.map((p) => p.updated_at));
  const postsUpdated = newest(posts.map((p) => p.updated_at));
  const siteUpdated = newest([
    servicesUpdated.toISOString(),
    projectsUpdated.toISOString(),
    postsUpdated.toISOString(),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: siteUpdated, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/services`, lastModified: servicesUpdated, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/portfolio`, lastModified: projectsUpdated, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/blog`, lastModified: postsUpdated, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/about`, lastModified: siteUpdated, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/contact`, lastModified: siteUpdated, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/book`, lastModified: siteUpdated, changeFrequency: "monthly", priority: 0.6 },
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
