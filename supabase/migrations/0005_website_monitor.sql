-- =====================================================================
-- Trellee — website uptime monitor. Admin-only (RLS on, no policies; access
-- via the service-role client behind requireOwner() and the cron route).
-- =====================================================================

create table if not exists public.monitored_sites (
  id               uuid primary key default gen_random_uuid(),
  label            text not null,
  url              text not null,
  active           boolean not null default true,
  is_up            boolean,                -- null = never checked yet
  last_status_code int,
  last_error       text,
  last_checked_at  timestamptz,
  last_changed_at  timestamptz,            -- when is_up last flipped
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create or replace trigger monitored_sites_updated
  before update on public.monitored_sites
  for each row execute function public.set_updated_at();

create index if not exists monitored_sites_active_idx on public.monitored_sites(active);

alter table public.monitored_sites enable row level security;
