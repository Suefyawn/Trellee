# Finalize — Trellee go-live runbook

This is the operator runbook for taking the hardened codebase to production. It
picks up where the code work ends: the app builds clean, is security-patched,
and has Sentry/PostHog wired but inert. Everything below is **infrastructure +
keys**, to be executed once direct MCP access (Supabase, Vercel, Sentry,
PostHog, Resend) is granted.

> Companion docs: `LAUNCH.md` is the exhaustive manual checklist; this file is
> the condensed, automatable sequence with the exact env each step produces.

---

## What's already done (code)

- ✅ Next.js patched `15.0.3 → 15.5.18` (cleared the critical RCE/DoS/auth-bypass advisories)
- ✅ React + Tailwind moved off pre-release onto stable (`react@19`, `tailwindcss@4`)
- ✅ ESLint configured (`eslint.config.mjs`) — `npm run lint`, `npm run typecheck`, `npm run build` all clean
- ✅ Admin gate fails **closed** (no `ADMIN_OWNER_EMAIL` ⇒ deny, not allow)
- ✅ Public contact/booking actions reject oversized payloads
- ✅ Security headers on every response (HSTS, nosniff, frame options, referrer + permissions policy)
- ✅ Sentry wired (server/edge/client + error boundary) — inert until `NEXT_PUBLIC_SENTRY_DSN`
- ✅ PostHog wired (lazy-loaded) — inert until `NEXT_PUBLIC_POSTHOG_KEY`

Runtime: Node 22 (matches Vercel default). No `engines` pin — Vercel auto-detects.

---

## The env matrix

Every variable the production deploy needs, and where its value comes from.

| Variable | Scope | Source | Required? |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase → API settings | **yes** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Supabase → API settings | **yes** |
| `SUPABASE_SERVICE_ROLE_KEY` | server | Supabase → API settings | **yes** |
| `ADMIN_OWNER_EMAIL` | server | The single admin login email | **yes** (gate fails closed without it) |
| `NEXT_PUBLIC_SITE_URL` | public | `https://trellee.com` | **yes** |
| `RESEND_API_KEY` | server | Resend → API Keys | for email |
| `EMAIL_FROM` | server | `Trellee <hello@trellee.com>` (verified domain) | for email |
| `NEXT_PUBLIC_SENTRY_DSN` | public | Sentry → Client Keys | optional |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | build | Sentry (source-map upload) | optional |
| `NEXT_PUBLIC_POSTHOG_KEY` | public | PostHog → Project settings | optional |
| `NEXT_PUBLIC_POSTHOG_HOST` | public | `https://us.i.posthog.com` (or EU) | optional |

---

## Step 1 — Supabase (database + auth + storage)

1. Create project `trellee` in the **US East** region (audience is Miami; keep
   latency low). Save the generated DB password.
2. Apply the schema: run `supabase/migrations/0001_init.sql` (all 16 tables, RLS
   policies, triggers, storage buckets/policies). It's idempotent — safe to
   re-run, and safe to run even if you pre-created the `media`/`videos` buckets
   in the UI first.
3. Verify: run `supabase/verify.sql` — every row should read **PASS** (16 tables,
   RLS on all of them, no anon SELECT on the lead tables, both buckets public,
   the singleton settings row).
4. *(Optional, recommended for first smoke test)* run `supabase/seed.sql` to
   load sample content, then replace with real content via `/admin` later.
5. Create the owner auth user with `ADMIN_OWNER_EMAIL`; set a password.
6. **Lock down signup**: Auth → Providers → disable public email signup (the
   admin gate is single-owner; no self-serve accounts should exist).
7. Capture `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`.
8. Run the Supabase advisors (security + performance lint) and clear anything
   high severity before launch.

## Step 2 — Resend (transactional email)

1. Add `trellee.com` as a sending domain; add the SPF/DKIM/DMARC DNS records it
   prints. **Do not touch existing MX records** — inbound mail is unaffected.
2. Wait for "Verified".
3. Create a send-only API key → `RESEND_API_KEY`.
4. Set `EMAIL_FROM=Trellee <hello@trellee.com>` (must be on the verified domain).
   - Email degrades gracefully: if these are unset, forms still save to the DB
     and the user still sees success — only the notification email is skipped.

## Step 3 — Sentry (optional but recommended)

1. Create a Next.js project → `NEXT_PUBLIC_SENTRY_DSN`.
2. For source-map upload set `SENTRY_ORG`, `SENTRY_PROJECT`, and a build-scoped
   `SENTRY_AUTH_TOKEN` (Vercel env only, never local/committed).
3. Leave sample rates at the `0.1` defaults; tune after observing volume.
   - Tradeoff: the Sentry browser SDK adds ~80 kB to the shared client bundle
     once enabled. If Lighthouse needs the headroom, switch the client init to
     lazy-load (mirror the PostHog provider pattern). Session Replay is already
     off (sample rates 0).

## Step 4 — PostHog (optional)

1. Create a project → `NEXT_PUBLIC_POSTHOG_KEY`; set `NEXT_PUBLIC_POSTHOG_HOST`
   to the US or EU ingest host. Pageview capture is already wired.

## Step 5 — Vercel (build + host)

1. Create/import the project from this repo onto the `sufyan-s-projects` team.
2. Add **all** env vars from the matrix to the **Production** environment (and
   Preview if you want previews to talk to a DB). `NEXT_PUBLIC_SITE_URL` must be
   `https://trellee.com` in Production.
3. Trigger a deploy; confirm it's green and the `*.vercel.app` URL renders
   against real Supabase data.
4. Preview smoke test (no DNS yet): sign into `/admin/login`; submit a test
   booking + contact → rows land in Supabase, emails fire, Sentry/PostHog
   receive events.

## Step 6 — DNS cutover (the only irreversible, outward-facing step)

> ⚠️ This replaces the live WordPress site. **Back up WordPress first** (DB
> export + `wp-content/uploads`) and screenshot current DNS (A / CNAME / **MX**).
> Get explicit go-ahead before executing — see `LAUNCH.md` Phase 7 + rollback.

1. Vercel → Domains → add `trellee.com` and `www.trellee.com` (www → apex redirect).
2. At the DNS provider: apex `A → 76.76.21.21`, `www CNAME → cname.vercel-dns.com`.
   **Leave MX untouched** so email keeps flowing.
3. Wait for propagation; Vercel shows "Valid Configuration" + SSL.
4. Live smoke test (the 9 routes, 404, booking, contact, admin login, OG image).
5. Submit `https://trellee.com/sitemap.xml` to Google Search Console.

**Rollback:** point the apex A record back to the old WordPress host IP (≤5 min
to start, then propagation). Supabase data from the live window is retained.

---

## First 24 hours

Watch Vercel logs, Supabase API logs/advisors, Resend deliverability, and Sentry
issues. Confirm real bookings/leads arrive and no recurring 5xx.
