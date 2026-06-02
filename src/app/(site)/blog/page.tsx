import Link from "next/link";
import Image from "next/image";
import {
  getBlogCategories,
  getBlogPosts,
  getSiteSettings,
  getTeamMembers,
} from "@/lib/cms";
import { Reveal } from "@/components/site/reveal";
import { PostCover } from "@/components/site/post-cover";
import { NewsletterForm } from "@/components/site/newsletter-form";
import { formatDate } from "@/lib/utils";

// Rebuild from the CMS at most every 10 minutes (ISR), so content edits in
// the admin go live without a manual redeploy.
export const revalidate = 600;

export const metadata = {
  title: "Field notes",
  description: "What we shipped, what broke, what we're reading.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const [categories, allPosts, team, settings] = await Promise.all([
    getBlogCategories(),
    getBlogPosts(),
    getTeamMembers(),
    getSiteSettings(),
  ]);

  // Only surface category filters that actually have posts, so empty
  // categories don't show as dead-end filter chips.
  const usedCategoryIds = new Set(
    allPosts.map((p) => p.category_id).filter(Boolean),
  );
  const visibleCategories = categories.filter((c) => usedCategoryIds.has(c.id));

  const activeCategory = params.category
    ? categories.find((c) => c.slug === params.category)
    : undefined;
  const posts = activeCategory
    ? allPosts.filter((p) => p.category_id === activeCategory.id)
    : allPosts;

  const featured = posts.find((p) => p.featured) ?? posts[0];
  const rest = posts.filter((p) => p.id !== featured?.id);

  const authorById = new Map(team.map((t) => [t.id, t]));
  const catById = new Map(categories.map((c) => [c.id, c]));

  return (
    <>
      <section className="relative pt-16 pb-12 lg:pt-24 lg:pb-16 overflow-hidden">
        <div className="mesh" />
        <div className="relative max-w-[1280px] mx-auto px-6 lg:px-10">
          <Reveal>
            <span className="mono-tag">Field notes</span>
            <h1 className="t-display-xl mt-5 max-w-[20ch] font-display">
              What we shipped,
              <br />
              <span className="text-muted">what we&apos;re thinking.</span>
            </h1>
            <p className="t-body-l text-muted mt-6 max-w-2xl">
              Notes on the work: engineering, design, growth, and the messy parts of
              running a small studio. No clickbait, no list-of-tools posts.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Sticky filters */}
      <section className="py-5 border-y border-border sticky top-16 z-30 backdrop-blur-md bg-bg/80">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <Link
              href="/blog"
              className={`px-3 py-1.5 rounded-md t-mono text-xs whitespace-nowrap transition ${
                !params.category
                  ? "bg-fg text-bg"
                  : "text-muted hover:text-fg hover:bg-surface-2"
              }`}
            >
              All notes
            </Link>
            {visibleCategories.map((c) => (
              <Link
                key={c.id}
                href={`/blog?category=${c.slug}`}
                className={`px-3 py-1.5 rounded-md t-mono text-xs whitespace-nowrap transition ${
                  params.category === c.slug
                    ? "bg-fg text-bg"
                    : "text-muted hover:text-fg hover:bg-surface-2"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Posts */}
      <section className="py-16 lg:py-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          {posts.length === 0 ? (
            <p className="t-body text-muted">
              No posts in this category yet. Check back soon.
            </p>
          ) : (
            <>
              {/* Featured */}
              {featured ? (
                <Link
                  href={`/blog/${featured.slug}`}
                  className="surface-card overflow-hidden block group hover:border-border-strong transition mb-16"
                >
                  <div className="grid lg:grid-cols-12">
                    {featured.cover_url ? (
                      <div className="lg:col-span-7 relative aspect-[16/9] lg:aspect-auto overflow-hidden bg-surface-2">
                        <Image
                          src={featured.cover_url}
                          alt={featured.title}
                          fill
                          sizes="(max-width: 1024px) 100vw, 58vw"
                          className="object-cover transition duration-500 group-hover:scale-[1.02]"
                        />
                      </div>
                    ) : (
                      <PostCover
                        label={
                          featured.category_id
                            ? (catById.get(featured.category_id)?.name ?? null)
                            : null
                        }
                        className="lg:col-span-7 aspect-[16/9] lg:aspect-auto"
                      />
                    )}
                    <div className="lg:col-span-5 p-8 lg:p-10 flex flex-col justify-center">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="badge badge-brand">Featured</span>
                        {featured.category_id
                          ? (() => {
                              const cat = catById.get(featured.category_id);
                              return cat ? (
                                <span className="badge">{cat.name}</span>
                              ) : null;
                            })()
                          : null}
                      </div>
                      <h2 className="t-heading-xl font-display mt-4">
                        {featured.title}
                      </h2>
                      <p className="t-body text-muted mt-4 line-clamp-3">
                        {featured.excerpt}
                      </p>
                      <div className="flex items-center gap-3 mt-6 t-mono text-muted text-xs">
                        {featured.author_id
                          ? (authorById.get(featured.author_id)?.name ?? "")
                          : ""}
                        {featured.published_at ? (
                          <>
                            <span>·</span>
                            <span>{formatDate(featured.published_at)}</span>
                          </>
                        ) : null}
                        {featured.reading_time ? (
                          <>
                            <span>·</span>
                            <span>{featured.reading_time} min read</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Link>
              ) : null}

              {/* Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rest.map((post) => {
                  const author = post.author_id
                    ? authorById.get(post.author_id)
                    : undefined;
                  const cat = post.category_id
                    ? catById.get(post.category_id)
                    : undefined;
                  return (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      className="surface-card overflow-hidden group hover:border-border-strong transition flex flex-col"
                    >
                      {post.cover_url ? (
                        <div className="relative aspect-[16/9] overflow-hidden bg-surface-2">
                          <Image
                            src={post.cover_url}
                            alt={post.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover transition duration-500 group-hover:scale-[1.03]"
                          />
                        </div>
                      ) : (
                        <PostCover label={cat?.name} className="aspect-[16/9]" />
                      )}
                      <div className="p-6 flex-1 flex flex-col">
                        {cat ? (
                          <span className="badge self-start">{cat.name}</span>
                        ) : null}
                        <h3 className="t-heading-l font-display mt-3">
                          {post.title}
                        </h3>
                        <p className="t-small text-muted mt-3 line-clamp-3 flex-1">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between mt-5 pt-4 border-t border-border t-mono text-muted text-xs">
                          <span>{author?.name ?? ""}</span>
                          <span>
                            {post.published_at
                              ? formatDate(post.published_at)
                              : ""}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-24 lg:py-32">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="surface-card p-10 lg:p-14 text-center relative overflow-hidden">
            <div className="mesh opacity-30" />
            <div className="relative">
              <span className="mono-tag justify-center">Subscribe</span>
              <h2 className="t-display-l mt-5 font-display">
                {settings.newsletter_heading}
              </h2>
              <p className="t-body-l text-muted mt-5 max-w-xl mx-auto">
                {settings.newsletter_subheading}
              </p>
              <NewsletterForm source="blog" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
