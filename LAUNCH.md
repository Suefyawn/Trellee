# Launch checklist — Trellee.com

Step-by-step verification before flipping DNS from the current WordPress site to this Next.js build. Work top to bottom — each phase has to pass before the next one starts. Save this file open in a tab and tick items as you go.

> **Rollback plan** lives at the bottom. Read it before you start the DNS cutover.

---

## Phase 1 — Local dev (no external services)

Just `npm run dev` against demo data. Confirms the build works in isolation.

- [ ] `npm install` runs clean (no peer-dep warnings worth investigating)
- [ ] `npm run dev` starts without errors
- [ ] `npm run build` completes (run this once before deploying — catches things `dev` doesn't)
- [ ] `npx tsc --noEmit` is clean
- [ ] No browser console errors on the homepage (open DevTools, hard refresh)
- [ ] Visual smoke test on the 9 main routes:
  - [ ] `/` — homepage (hero ticker cycles, bento grid tiles correctly, build-log card renders, reviews show)
  - [ ] `/services` — 3 category sections render, single-service category uses the wide layout
  - [ ] `/services/custom-crm` — code window mock, problem statement, 3 principles, process steps, pricing tiers, FAQ
  - [ ] `/portfolio` — filter chips work (click "Custom CRMs" → URL changes, grid updates)
  - [ ] `/portfolio/northside-operator` — CRM dashboard mock, metrics, gallery (if seeded), technologies, testimonial
  - [ ] `/book` — 4-step booking flow advances and validates each step
  - [ ] `/blog` — featured post + grid, category chips work
  - [ ] `/blog/why-we-dont-do-discovery-phases` — markdown renders headings, lists, quotes, code
  - [ ] `/about` — origin story, values, stats, team grid
  - [ ] `/contact` — form validates required fields, submit shows success state
- [ ] Mobile smoke test (DevTools → 375px viewport):
  - [ ] Hamburger menu opens, drawer fills full viewport height
  - [ ] Bento tiles stack and the Custom CRM tile shows all its copy
  - [ ] Sticky filter chip rows scroll horizontally (portfolio, blog)
- [ ] 404 page (`/no-such-page`) renders the branded layout
- [ ] Skip-to-content link appears top-left on first `Tab` from the URL bar

---

## Phase 2 — Supabase wiring

Connect the database. Everything still local — just talking to a remote DB.

### 2.1 — Create the project
- [ ] Supabase project created at <https://supabase.com>
- [ ] Project region picked to be near your audience (US-East for Miami)
- [ ] `.env.local` populated with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### 2.2 — Schema + seed
- [ ] Ran `supabase/migrations/0001_init.sql` in the SQL editor — completed without errors
- [ ] Confirmed tables in the Supabase Table Editor: `services`, `projects`, `reviews`, `clients`, `process_steps`, `activity_feed`, `team_members`, `values`, `social_links`, `faqs`, `pricing_tiers`, `bookings`, `contact_submissions`, `blog_posts`, `blog_categories`, `site_settings`
- [ ] *(Optional)* Ran `supabase/seed.sql` to populate sample data — useful for confirming the wiring works before adding real content
- [ ] Storage bucket `media` exists (Supabase → Storage → New bucket → "media", public)
- [ ] Storage bucket `videos` exists (same flow, public)

### 2.3 — Auth + admin gate
- [ ] Created the owner user: Supabase → Authentication → Users → "Add user (Send invite)" with the email you set as `ADMIN_OWNER_EMAIL`
- [ ] Set a password via the invite email or the Supabase dashboard
- [ ] `npm run dev`, visit `/admin/login`, sign in — lands on `/admin` dashboard
- [ ] Sign in with a DIFFERENT email is rejected (the owner gate works)
- [ ] Sign out → admin redirects to `/admin/login`

### 2.4 — Admin CRUD smoke test
- [ ] Create a Service, set it featured, save → appears on the homepage bento
- [ ] Edit a Project, mark it featured → it's the hero on `/portfolio`
- [ ] Upload a video Review (10-second MP4 is fine for testing) → plays on the homepage reviews section
- [ ] Create a Blog post → appears on `/blog`
- [ ] Open `/admin/bookings` (should be empty); submit a fake booking at `/book` → appears in the table
- [ ] Open `/admin/leads`; submit a fake contact form → appears in the table
- [ ] Edit Site Settings (change hero ticker words) → homepage updates after a refresh

### 2.5 — Replace seed with real content
This is the time-consuming step. Block out a half-day.

- [ ] Site Settings: real tagline, ticker words, booking slot count, stats, footer copy
- [ ] Services: at least the 10 disciplines with real descriptions, deliverables, FAQs, pricing tiers per service
- [ ] Projects: 3–6 real case studies with metrics, gallery, technologies, testimonial
- [ ] Reviews: at least 3 text reviews + the real video review files uploaded
- [ ] Clients: real logos for the trust bar (PNG with transparent background, ~80px tall)
- [ ] Team: real photos, names, roles, bios
- [ ] Process steps: real 5-step process (or however many you want)
- [ ] Activity feed: real ship log (or remove the section if you don't want to maintain it)
- [ ] Blog posts: at least 3 real posts so `/blog` doesn't look empty
- [ ] FAQs: at minimum a global set + a Custom CRM set
- [ ] Social links: real X, LinkedIn, GitHub URLs

---

## Phase 3 — Email (Resend)

Real notifications wired up. Validates the booking + contact loop end-to-end.

- [ ] Resend account created at <https://resend.com>
- [ ] Sending domain added (probably `trellee.com` itself)
- [ ] DNS records added to your DNS provider (SPF + DKIM + DMARC) — Resend's dashboard tells you exactly what to add
- [ ] Domain status shows "Verified" in Resend → Domains (can take 5–30 min)
- [ ] API key created (Resend → API Keys → "Create API key" with "Send access" only, not Full access)
- [ ] `.env.local`: `RESEND_API_KEY=re_...` and `EMAIL_FROM=Trellee <hello@trellee.com>` (must be on the verified domain)
- [ ] Restart dev server
- [ ] Submit a test booking → check inbox for **both** emails (admin notification + submitter confirmation)
- [ ] Submit a test contact form → same two emails arrive
- [ ] Click "Reply" on the admin notification — the To: field auto-fills with the submitter's email (so you can start a conversation from the inbox)
- [ ] Test in Gmail web AND Apple Mail or Outlook — formatting should look right in all three

---

## Phase 4 — Branding, SEO, social

Quick polish pass before going live.

- [ ] Favicon visible in the browser tab (the teal "T." mark)
- [ ] Visit `/opengraph-image` directly — the 1200×630 image renders
- [ ] Paste your eventual production URL into <https://opengraph.xyz> or <https://metatags.io> — title, description, image all show correctly
- [ ] LinkedIn post inspector: <https://www.linkedin.com/post-inspector/> shows the right preview
- [ ] Twitter card validator: <https://cards-dev.twitter.com/validator>
- [ ] `/sitemap.xml` loads, lists all routes (services, projects, posts included)
- [ ] `/robots.txt` allows `/`, disallows `/admin` and `/api`
- [ ] Page titles all read as `<Section> — Trellee` in the browser tab (set by `metadata.title.template` in the root layout)
- [ ] `<meta name="description">` is unique per page (homepage, services, portfolio, etc.) — verify in DevTools → Elements → `<head>`

---

## Phase 5 — Accessibility + performance

Brief asked for WCAG AA + Lighthouse ≥ 90 mobile. Verify both.

### A11y
- [ ] Tab through the homepage start to finish using only the keyboard — focus rings visible on every interactive element
- [ ] Skip-to-content link appears on first Tab (top-left)
- [ ] On `/services`, the "Services" nav link has the active visual state (background)
- [ ] Open dev tools → Lighthouse → Accessibility audit on `/` and `/services/custom-crm` — score ≥ 95
- [ ] Try `prefers-reduced-motion` (DevTools → Rendering → Emulate "reduce") — hero ticker stops cycling, scroll reveals don't animate, custom cursor hides
- [ ] Screen reader smoke test (VoiceOver on Mac, NVDA on Windows): nav links announced, headings make sense, form labels read

### Performance
- [ ] Lighthouse Performance audit on `/` (mobile preset) — score ≥ 90
- [ ] LCP < 2.5s, CLS < 0.1
- [ ] Check `/_next/image` is being used for all photos (right-click → Inspect on any image — `src` starts with `/_next/image`)
- [ ] Large uploaded media (case study screenshots, blog covers) are < 500KB each — if not, run them through `https://squoosh.app` before re-uploading
- [ ] Network tab on a hard refresh of `/` — total transferred < 1.5MB on initial load (excluding cached fonts)

---

## Phase 6 — Stage on Vercel

Production build, real env, public preview URL. Final dress rehearsal before DNS.

- [ ] Repo pushed to GitHub (or your Git host)
- [ ] Vercel project imported from the repo
- [ ] Vercel → Project → Settings → Environment Variables filled in (Production env):
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `ADMIN_OWNER_EMAIL`
  - [ ] `RESEND_API_KEY`
  - [ ] `EMAIL_FROM`
  - [ ] `NEXT_PUBLIC_SITE_URL=https://trellee.com`
- [ ] First deploy is green (Vercel → Deployments shows ✓)
- [ ] Open the `trellee.vercel.app` preview URL — site renders against real Supabase data
- [ ] Sign into `/admin/login` on the preview URL — works
- [ ] Submit a test booking on the preview URL — emails fire, row lands in Supabase
- [ ] Run Lighthouse on the preview URL — scores match local

---

## Phase 7 — DNS cutover

**Read the rollback section first.** Don't skip the WordPress snapshot.

### 7.1 — Backup the current site
- [ ] WordPress database exported (cPanel → phpMyAdmin → Export, or whatever host you're on)
- [ ] WordPress files snapshotted (`/wp-content/uploads`, themes, plugins — anything custom)
- [ ] Snapshot saved somewhere outside the WP host (Dropbox, S3, your laptop)
- [ ] Note the current DNS records: A record, CNAME, MX (for email) — save a screenshot

### 7.2 — Point DNS to Vercel
- [ ] Vercel → Project → Settings → Domains → "Add Domain" → `trellee.com`
- [ ] Vercel → Project → Settings → Domains → "Add Domain" → `www.trellee.com` (set to redirect to apex)
- [ ] Vercel prints the records you need to add. Common case:
  - For apex `trellee.com`: A record pointing to `76.76.21.21` (Vercel's anycast IP)
  - For `www`: CNAME pointing to `cname.vercel-dns.com`
- [ ] **Don't touch MX records** — email continues going wherever it was (likely Google Workspace, Zoho, or your WP host)
- [ ] Add the records in your DNS provider
- [ ] Wait 5–30 minutes for propagation
- [ ] `dig trellee.com` (or use <https://dnschecker.org>) shows the new IP from multiple regions
- [ ] Vercel domain status shows "Valid Configuration" with SSL ✓ (Vercel auto-provisions Let's Encrypt)

### 7.3 — Smoke test live URLs
Open <https://trellee.com> and walk the full site one more time:

- [ ] Homepage loads, hero ticker animates, real content shows
- [ ] All 9 main routes return 200 (the same list from Phase 1)
- [ ] `/no-such-page` returns 404 with the branded page
- [ ] Submit a test booking — emails arrive, row in `/admin/bookings`
- [ ] Submit a test contact form — emails arrive, row in `/admin/leads`
- [ ] Delete both test rows from `/admin/bookings` and `/admin/leads`
- [ ] Sign into `/admin/login` — works
- [ ] OG image: paste `https://trellee.com` into <https://opengraph.xyz> — production image and metadata render
- [ ] Submit your sitemap to Google: <https://search.google.com/search-console> → Add property → submit `https://trellee.com/sitemap.xml`

---

## Phase 8 — First 24 hours

Watch for things that only surface under real traffic.

- [ ] Vercel → Project → Logs — no recurring server errors
- [ ] Supabase → Dashboard → Logs (API) — no auth failures spiking, no 5xx
- [ ] Resend → Emails — every test submission landed (not bounced/marked spam)
- [ ] Real bookings/leads flowing in (if not, check both Supabase auth logs and Resend send logs)
- [ ] Set a calendar reminder for 24h from now to re-check all four dashboards

---

## Rollback plan

If something is fundamentally broken after cutover and you need to revert:

1. **Fastest revert** (5 min): Go to your DNS provider and change the A record back to the old WordPress host's IP. SSL on the WP side stays valid. Site is back, no data lost on either side.
2. **Restore WordPress data** *(only if WP was modified during the rollout window)*: import the SQL backup from Phase 7.1 via phpMyAdmin; re-upload the `/wp-content/uploads` snapshot.
3. **Keep the new site at the Vercel preview URL** so you can keep working on it without users seeing it.
4. **Don't delete Supabase data** — bookings and leads from the brief live window are still in there, you can pull them out of `/admin/bookings` and `/admin/leads`.

The trade-off: a DNS revert takes 5 minutes to start but DNS propagation back to the old IP can take 5–30 minutes for end users. There's no "instant" rollback — that's why Phase 6 (Vercel preview validation) is non-negotiable.
