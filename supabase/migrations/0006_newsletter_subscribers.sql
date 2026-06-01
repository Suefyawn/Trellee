-- Newsletter subscribers captured from the public site (blog footer form).
-- Admin-only: RLS enabled with no policies, so anon has zero access; the
-- public signup writes through a server action using the service-role key.
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text,
  created_at timestamptz not null default now()
);
alter table public.newsletter_subscribers enable row level security;
