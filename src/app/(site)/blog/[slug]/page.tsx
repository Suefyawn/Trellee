import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import {
  getBlogCategories,
  getBlogPostBySlug,
  getBlogPosts,
  getTeamMembers,
} from "@/lib/cms";
import { Reveal } from "@/components/site/reveal";
import { Markdown } from "@/components/site/markdown";
import { formatDate } from "@/lib/utils";

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.meta_title ?? post.title,
    description: post.meta_description ?? post.excerpt,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const [categories, team, related] = await Promise.all([
    getBlogCategories(),
    getTeamMembers(),
    getBlogPosts({ limit: 3 }),
  ]);
  const author = post.author_id ? team.find((t) => t.id === post.author_id) : null;
  const cat = post.category_id ? categories.find((c) => c.id === post.category_id) : null;
  const relatedPosts = related.filter((p) => p.id !== post.id).slice(0, 2);

  return (
    <>
      <section className="relative pt-16 pb-12 lg:pt-24 lg:pb-16 overflow-hidden">
        <div className="mesh" />
        <div className="relative max-w-[800px] mx-auto px-6 lg:px-10">
          <Reveal>
            <Link
              href="/blog"
              className="t-mono text-muted hover:text-fg transition inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> All notes
            </Link>
          </Reveal>
          <Reveal className="mt-8">
            <div className="flex items-center gap-2 flex-wrap">
              {cat ? <span className="badge">{cat.name}</span> : null}
              {post.published_at ? (
                <span className="t-mono text-muted text-xs">
                  {formatDate(post.published_at)}
                </span>
              ) : null}
              {post.reading_time ? (
                <span className="t-mono text-muted text-xs">
                  · {post.reading_time} min
                </span>
              ) : null}
            </div>
            <h1 className="t-display-l font-display mt-4">{post.title}</h1>
            {post.excerpt ? (
              <p className="t-body-l text-muted mt-6">{post.excerpt}</p>
            ) : null}
            {author ? (
              <div className="flex items-center gap-3 mt-8 pt-6 border-t border-border">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-bg font-semibold text-sm">
                  {author.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div>
                  <div className="t-small text-fg">{author.name}</div>
                  {author.role ? (
                    <div className="t-mono text-muted text-xs">{author.role}</div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </Reveal>
        </div>
      </section>

      <article className="py-12 lg:py-16">
        <div className="max-w-[760px] mx-auto px-6 lg:px-10">
          <Markdown source={post.body ?? ""} />
        </div>
      </article>

      {relatedPosts.length > 0 ? (
        <section className="py-24 lg:py-32">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <h2 className="t-heading-xl font-display mb-8">Keep reading</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {relatedPosts.map((p) => (
                <Link
                  key={p.id}
                  href={`/blog/${p.slug}`}
                  className="surface-card p-7 group hover:border-border-strong transition flex flex-col justify-between min-h-[200px]"
                >
                  <div className="flex items-start justify-between">
                    <span className="mono-tag">Field note</span>
                    <ArrowUpRight className="w-5 h-5 text-muted group-hover:text-fg group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition" />
                  </div>
                  <div>
                    <h3 className="t-heading-l font-display">{p.title}</h3>
                    <p className="t-small text-muted mt-2 line-clamp-2">
                      {p.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
