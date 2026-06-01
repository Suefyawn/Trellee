-- CRM deal fields: estimated value, won/lost reason, and a last-activity
-- timestamp, on both lead tables (bookings + contact_submissions).
alter table public.bookings
  add column if not exists deal_value numeric,
  add column if not exists outcome_reason text,
  add column if not exists crm_updated_at timestamptz;

alter table public.contact_submissions
  add column if not exists deal_value numeric,
  add column if not exists outcome_reason text,
  add column if not exists crm_updated_at timestamptz;
