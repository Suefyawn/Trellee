-- Stores long-lived OAuth refresh tokens for server-to-server API access
-- (e.g. Google Search Console via the owner's own Google account, instead of a
-- service account). One row per provider. RLS is enabled with NO policies, so
-- anon/authenticated clients get zero access; only the service-role admin
-- client (used by server actions / route handlers) can read or write it.
create table if not exists public.integration_tokens (
  provider text primary key,
  refresh_token text not null,
  account_email text,
  scope text,
  updated_at timestamptz not null default now()
);

alter table public.integration_tokens enable row level security;
