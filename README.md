# Trellee

Marketing site + CMS-driven admin for **Trellee** — a full-stack digital agency.

Stack: **Next.js 15 (App Router) · React 19 · Tailwind v4 · Supabase (Postgres + Auth + Storage) · TypeScript**.

The visual contract lives in [`.design/trellee-redesign/`](./.design/trellee-redesign/) (the HTML mockups exported from claude.ai/design). The implementation here is a faithful translation into Next.js Server Components.

---

## Quick start (local, with demo data)

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. The site renders against built-in **demo data** so you can preview the design without Supabase. The admin shell is reachable at <http://localhost:3000/admin/login>, but you'll need Supabase wired up to actually sign in or save data.

## Connecting Supabase

1. **Create a Supabase project** at <https://supabase.com>.
2. **Copy `.env.example` → `.env.local`** and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` *(server-only)*
   - `ADMIN_OWNER_EMAIL` *(the single account allowed to access `/admin`)*
3. **Run the schema:** open the Supabase SQL editor and paste [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql) — runs in ~5 seconds.
4. **(Optional) Seed sample content:** run [`supabase/seed.sql`](./supabase/seed.sql) to populate services, a project, FAQs, pricing tiers, etc.
5. **Create the owner account:**
   - Supabase dashboard → Authentication → Users → "Add user"
   - Use the same email you set as `ADMIN_OWNER_EMAIL`.
6. **Restart the dev server.** That's it — the marketing site now reads from Supabase, and `/admin/login` works.

> Demo data fallback: every CMS read silently falls back to the demo data if Supabase isn't configured or a table is empty. This means a misconfigured env never breaks the marketing site — it just looks like the seed content again.

## Email notifications (Resend)

Bookings and contact form submissions send two emails each: a notification to the admin (`ADMIN_OWNER_EMAIL`) and a confirmation to the submitter. If Resend isn't configured, emails are skipped silently — the form/booking still saves to the database, you just don't get notified.

1. **Sign up at <https://resend.com>** (free tier: 100/day, 3,000/mo).
2. **Verify your sending domain.** Resend → Domains → Add Domain → add the DNS records they give you (SPF + DKIM). Once verified, you can send from any address `@yourdomain.com`.
3. **Create an API key.** Resend → API Keys → "Create API Key". Copy it.
4. **Fill in `.env.local`:**
   - `RESEND_API_KEY=re_...`
   - `EMAIL_FROM=Trellee <hello@trellee.com>` *(must be on the verified domain)*
5. **Restart the dev server.** New bookings + contact submissions now trigger emails.

> Email failures never block form submissions — they're logged and forgotten, the DB row is always the source of truth.

## Observability (optional)

Error tracking (**Sentry**) and product analytics (**PostHog**) are wired in but
fully inert until you provide keys — no DSN/key means no init, no network calls,
and (for PostHog) the library isn't even bundled. Add the relevant
`NEXT_PUBLIC_*` vars from `.env.example` to switch them on. See
[`FINALIZE.md`](./FINALIZE.md) for the full go-live runbook.

## Project layout

```
src/
├── app/
│   ├── (site)/             # public marketing site (route group)
│   │   ├── layout.tsx          # nav + footer
│   │   ├── page.tsx            # homepage
│   │   ├── services/           # listing + detail
│   │   ├── portfolio/          # listing + case study
│   │   ├── book/               # booking flow (4 steps)
│   │   ├── blog/               # listing + post
│   │   ├── about/
│   │   └── contact/
│   ├── admin/
│   │   ├── login/              # outside the shell, public route
│   │   ├── (shell)/            # protected by middleware + AdminShell wrapper
│   │   │   ├── page.tsx        # dashboard
│   │   │   ├── services/
│   │   │   ├── projects/
│   │   │   ├── reviews/
│   │   │   ├── blog/posts + blog/categories
│   │   │   ├── bookings/
│   │   │   ├── leads/
│   │   │   ├── settings/
│   │   │   ├── clients/ team/ values/ process/ activity/ social/ faqs/
│   │   └── _actions/           # server actions (auth, CRUD per entity)
│   ├── actions/                # public form actions (booking, contact)
│   └── globals.css
├── components/
│   ├── site/                   # public marketing components
│   └── admin/                  # admin shell, forms, editors
├── lib/
│   ├── supabase/               # server/client/middleware clients
│   ├── cms/                    # data access layer (server-only)
│   │   ├── index.ts            # getServices, getProjects, etc.
│   │   └── demo-data.ts        # fallback content when Supabase isn't set
│   ├── types/database.ts       # typed schema
│   └── utils.ts
├── middleware.ts               # auth gate for /admin
supabase/
├── migrations/0001_init.sql    # full schema + RLS + storage buckets
└── seed.sql                    # sample content
```

## How the design tokens map

Tailwind v4 + `@theme` declarations in `src/app/globals.css` expose:

- **Colors:** `bg`, `surface`, `surface-2`, `border`, `fg`, `muted`, `brand-{300..700}`, `success`, `warning`, `danger` — all in OKLCH so the brand hue is consistent across light/dark math.
- **Fonts:** `font-display` (Cabinet Grotesk), `font-sans` (Geist), `font-mono` (Geist Mono).
- **Type scale:** `t-display-xl`, `t-display-l`, `t-heading-xl`, `t-heading-l`, `t-body-l`, `t-body`, `t-small`, `t-mono`.
- **Patterns:** `mono-tag`, `mesh`, `grid-bg`, `marquee`, `code-window`, `step-num`, `bento-tile`, `surface-card`, `live-dot`, `reveal`.

The brand accent (`brand-500`) is **teal-green** `oklch(0.65 0.19 160)`, matching the live trellee.com identity (not the blue from the original brief — see the chat transcript for the why).

## Admin features

All admin pages live under `/admin` and require a logged-in owner. The owner is whichever email matches `ADMIN_OWNER_EMAIL` — change that env var to swap owners.

**Manageable content (full CRUD):**
- Site settings (single row — hero copy, ticker, stats, CTA, newsletter, about/contact intros)
- Services (with per-service pricing tiers + FAQs as sub-resources, inline)
- Projects / case studies (metrics, technologies, gallery)
- Reviews — **text + video**, with file upload to Supabase Storage `videos` bucket
- Blog posts + categories
- Team members, values, clients, process steps, activity feed, social links, general FAQs

**Read + status updates:**
- Bookings (from `/book`) — change status: new / contacted / scheduled / won / lost / cancelled
- Contact leads (from `/contact`) — change status: new / contacted / closed / spam

Every write triggers a `revalidatePath()` for the public pages it affects, so changes appear on the live site within the next request.

## Public site features

- **Homepage** with kinetic ticker, services bento, featured case study + mock dashboard, process steps, video + text reviews, stats, booking CTA.
- **Service detail** with hero code window, problem statement, approach pillars, process (per-service), deliverables, pricing tiers, FAQs, related case study.
- **Portfolio** with filter-by-service-category bento grid; case study template with metrics, brief/approach/outcome, tech stack, testimonial, related work.
- **Booking flow** — 4-step interactive (service → time → details → confirm), stored in `bookings`.
- **Blog** listing with featured hero + category filters + grid; markdown-rendered post pages with author bio.
- **About** with origin story, six values, stats, team grid, philosophy.
- **Contact** with three methods (email / calendar / WhatsApp) + multi-service brief form + general FAQs.

## Going live → trellee.com

> **Use [`LAUNCH.md`](./LAUNCH.md)** — the step-by-step pre-launch checklist with all 8 phases (local validation → Supabase → email → SEO → a11y/perf → Vercel preview → DNS cutover → first-24h watch) plus a rollback plan. Tick items as you go. The summary below is just the high-level flow.

This build is the replacement for the current WordPress site at <https://trellee.com>. Cutover flow:

1. **Validate locally.** Run the site against your Supabase project at <http://localhost:3000>, sign in at `/admin/login`, replace seed content with real services, projects, reviews, and copy. Don't deploy until this is right — once it's live, it's live.
2. **Stage on Vercel.** Push to Git, import to Vercel. Set the same env vars (Supabase keys + `ADMIN_OWNER_EMAIL`) in the Vercel dashboard. Set `NEXT_PUBLIC_SITE_URL=https://trellee.com` for production. Vercel will give you a preview URL like `trellee.vercel.app` — use that to sanity-check the production build before pointing the domain.
3. **Cut over the DNS.** In Vercel → Project → Settings → Domains, add `trellee.com` (and `www.trellee.com`). Vercel prints the records to set at your DNS host (Cloudflare/Namecheap/wherever). Allow ~5-30 min for propagation. **Before this step, snapshot the current WordPress site** (database export + uploads folder) — it's the rollback plan.
4. **After cutover:** check OG tags, the sitemap, all 9 main routes, and the booking + contact forms. Submit one test booking and one test contact form, then delete them from `/admin/bookings` and `/admin/leads`.

The middleware enforces the owner check on every `/admin/*` request, so the admin remains protected after deploy.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server (port 3000, or 3001 if busy) |
| `npm run build` | Production build |
| `npm run start` | Run the production build locally |
| `npm run typecheck` | TypeScript no-emit check |
| `npm run lint` | Next.js / ESLint check |

## Notes for future you

- **Demo-data fallback** in `src/lib/cms/demo-data.ts` exists so the design always has something to render. Once Supabase has rows in every table, you can keep it or delete it — your call.
- **`values` is a reserved-ish SQL word** but the schema quotes it via `public.values` everywhere; if you ever switch ORMs, watch for that.
- **Video uploads** go to the `videos` bucket via a server action (`uploadAsset` in `src/app/admin/_actions/reviews.ts`). The service-role key never reaches the browser.
- The middleware **bypasses auth when Supabase isn't configured**, so local preview always works. This is intentional — it makes the design previewable before keys are wired up. The admin shell tells you it's not connected and refuses writes.
