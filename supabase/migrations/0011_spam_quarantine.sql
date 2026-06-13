-- Quarantine model: flagged spam is saved (never dropped) with status='spam',
-- kept out of the inbox + default admin views but reviewable. Pairs with the
-- Cloudflare Turnstile gate on the public forms.

-- bookings.status didn't allow 'spam'.
alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings add constraint bookings_status_check
  check (status in ('new','contacted','scheduled','won','lost','cancelled','spam'));

-- newsletter_subscribers had no status; add one so spam signups can be flagged.
alter table public.newsletter_subscribers
  add column if not exists status text not null default 'active';
alter table public.newsletter_subscribers drop constraint if exists newsletter_subscribers_status_check;
alter table public.newsletter_subscribers add constraint newsletter_subscribers_status_check
  check (status in ('active','spam'));

-- contact_submissions.status already allows 'spam' (see 0001_init).
