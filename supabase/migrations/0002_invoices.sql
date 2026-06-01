-- =====================================================================
-- Trellee — invoices (admin invoice generator)
-- Admin-only table: RLS enabled with NO policies, so the public/anon key
-- has no access. All reads/writes go through the service-role client behind
-- requireOwner() in the admin server actions.
-- =====================================================================

create table if not exists public.invoices (
  id             uuid primary key default gen_random_uuid(),
  number         text not null unique,                 -- e.g. INV-0001
  status         text not null default 'draft' check (status in ('draft','sent','paid','void')),
  client_name    text not null,
  client_email   text,
  client_company text,
  client_address text,
  issue_date     date not null default current_date,
  due_date       date,
  currency       text not null default 'USD',
  line_items     jsonb not null default '[]',          -- [{description, quantity, unit_price}]
  tax_rate       numeric not null default 0,           -- percent
  notes          text,
  total          numeric not null default 0,           -- computed on save (list view)
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create or replace trigger invoices_updated
  before update on public.invoices
  for each row execute function public.set_updated_at();

create index if not exists invoices_status_idx on public.invoices(status, issue_date desc);

alter table public.invoices enable row level security;
