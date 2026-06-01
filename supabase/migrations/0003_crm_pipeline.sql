-- =====================================================================
-- Trellee — CRM pipeline
-- Unifies the two inbound-lead tables (contact_submissions + bookings) into a
-- single sales pipeline: a shared stage + a private CRM note on each lead.
-- =====================================================================

alter table public.contact_submissions add column if not exists pipeline_stage text not null default 'new';
alter table public.contact_submissions add column if not exists crm_notes text;
alter table public.bookings add column if not exists pipeline_stage text not null default 'new';
alter table public.bookings add column if not exists crm_notes text;

alter table public.contact_submissions drop constraint if exists contact_submissions_pipeline_stage_chk;
alter table public.contact_submissions add constraint contact_submissions_pipeline_stage_chk
  check (pipeline_stage in ('new','contacted','qualified','proposal','won','lost'));
alter table public.bookings drop constraint if exists bookings_pipeline_stage_chk;
alter table public.bookings add constraint bookings_pipeline_stage_chk
  check (pipeline_stage in ('new','contacted','qualified','proposal','won','lost'));

create index if not exists contact_submissions_stage_idx on public.contact_submissions(pipeline_stage);
create index if not exists bookings_stage_idx on public.bookings(pipeline_stage);
