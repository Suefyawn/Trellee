# WordPress content export — trellee.com (old site)

Snapshot of the live WordPress (Elementor) site captured before the DNS cutover,
via the public REST API (`/wp-json/wp/v2/*`).

## Contents
- `posts.json` — 13 blog posts (full HTML content + metadata + embedded media/terms)
- `pages.json` — 6 pages (Home, Services, About, Contact, Blog, Privacy) — Elementor HTML, kept as reference copy
- `categories.json` — 9 categories
- `media1.json` / `media2.json` — 137 media items (URLs, alt text, dimensions)
- `blog_import.sql` — generated INSERTs that load the 13 posts (HTML→markdown) + categories into Supabase

## What was migrated into the new site
- **Blog posts → Supabase `blog_posts`** (HTML converted to markdown; cover images downloaded to `public/migrated/blog/`).
- **Categories → Supabase `blog_categories`** (deduped; "Uncategorized" dropped).
- **Brand assets → `public/migrated/brand/`** (old logo + site icon), for reference.

Pages (Home/Services/About/Contact) are Elementor layouts that don't map 1:1 to the
redesign's structured CMS; their text is preserved here as reference for refining
the new site's content.
