# Headless Blog API

Create and publish blog posts over HTTP — no Supabase, codebase, or admin-UI
access required. The only credential is a bearer token, so it's safe to hand to
an automation (e.g. a Claude scheduled task).

## Setup (once)

1. Generate a strong secret:
   ```bash
   openssl rand -hex 32
   ```
2. Add it to the deployment env as `BLOG_API_KEY` (Vercel → Settings →
   Environment Variables → Production) and redeploy.

Until `BLOG_API_KEY` is set, the endpoint returns `503`.

## Auth

Every request needs:

```
Authorization: Bearer <BLOG_API_KEY>
```

`401` = wrong/missing token. Keep the token secret; rotate by changing the env
var.

## `POST /api/admin/blog` — create / update / publish

Upserts by `slug` (idempotent: re-posting the same slug updates the post).

Body (JSON):

| field             | type            | notes |
| ----------------- | --------------- | ----- |
| `title`           | string          | **required** |
| `body`            | string (markdown) | the post content (alias: `content`) |
| `slug`            | string          | optional — defaults to a slug of `title` |
| `status`          | `"published"` \| `"draft"` | defaults to `"published"` |
| `published_at`    | ISO string      | defaults to now when publishing |
| `excerpt`         | string          | short summary |
| `cover_image_url` | string (URL)    | a generated/remote image to **re-host** into Supabase Storage (use this for Hugging Face output — the result is a CSP-allowed `*.supabase.co` URL) |
| `cover_image_base64` | string       | same, but inline base64 (`data:` prefix optional). Takes priority over `cover_image_url` |
| `cover_url`       | string (URL)    | direct cover URL — only if already on a CSP-allowed host (`*.supabase.co`, `images.unsplash.com`) |
| `category`        | string          | by name or slug — **created automatically** if it doesn't exist |
| `author`          | string          | matched to a team member by name (optional) |
| `reading_time`    | number          | minutes — auto-estimated from `body` if omitted |
| `featured`        | boolean         | defaults to `false` |
| `meta_title`      | string          | SEO title |
| `meta_description`| string          | SEO description |

Response:

```json
{ "ok": true, "id": "…", "slug": "my-post", "status": "published", "url": "https://trellee.com/blog/my-post" }
```

### Example

```bash
curl -X POST https://trellee.com/api/admin/blog \
  -H "Authorization: Bearer $BLOG_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Why headless commerce wins in 2026",
    "category": "Insights",
    "excerpt": "A short take on where commerce is heading.",
    "cover_url": "https://images.unsplash.com/photo-...",
    "body": "## The shift\n\nMarkdown body here. Use `##`+ for headings.\n\nMultiple paragraphs supported.",
    "status": "published"
  }'
```

## `GET /api/admin/blog` — list (+ internal-link targets)

Returns recent posts, categories, and the site's **services + portfolio**
slugs — so a caller can avoid duplicate slugs and build healthy *internal*
links to real pages (`/services/<slug>`, `/portfolio/<slug>`, `/blog/<slug>`):

```json
{
  "ok": true,
  "posts": [{ "id": "…", "slug": "…", "title": "…", "status": "published", "published_at": "…", "category_id": "…" }],
  "categories": [{ "slug": "insights", "name": "Insights" }],
  "services": [{ "slug": "web-development", "title": "Web Development" }],
  "projects": [{ "slug": "jewel-city-mattress", "title": "Jewel City Mattress" }],
  "site_url": "https://trellee.com"
}
```

## Notes

- Publishing revalidates `/blog`, `/blog/<slug>`, and `/` immediately (no 10-min
  ISR wait).
- The body is rendered as Markdown; the post title becomes the page `<h1>`, so
  start body headings at `##`.
- `/api/*` is disallowed in `robots.txt`, so the endpoint isn't crawled.
