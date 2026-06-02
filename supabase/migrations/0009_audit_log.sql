-- System-wide audit log. Captured by DB triggers so every write is recorded
-- no matter the source (admin app, public form submit, or direct SQL).
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor text,
  action text not null,
  entity text not null,
  entity_id text,
  label text,
  changed_keys text[],
  data jsonb
);
create index if not exists audit_log_at_idx on public.audit_log (at desc);
create index if not exists audit_log_entity_idx on public.audit_log (entity);
alter table public.audit_log enable row level security; -- no policies: service-role only

create or replace function public.log_audit() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  rec jsonb;
  actor text;
  ck text[];
begin
  if tg_op = 'DELETE' then rec := to_jsonb(old); else rec := to_jsonb(new); end if;

  begin
    actor := nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'role';
  exception when others then
    actor := null;
  end;
  actor := coalesce(actor, 'system');

  if tg_op = 'UPDATE' then
    select array_agg(k) into ck
    from jsonb_object_keys(to_jsonb(new)) k
    where to_jsonb(new)->k is distinct from to_jsonb(old)->k;
  end if;

  insert into public.audit_log(actor, action, entity, entity_id, label, changed_keys, data)
  values (
    actor, tg_op, tg_table_name,
    rec->>'id',
    nullif(coalesce(rec->>'title', rec->>'name', rec->>'number', rec->>'email',
                    rec->>'author_name', rec->>'label', rec->>'slug'), ''),
    case when tg_op = 'UPDATE' then ck else null end,
    (rec - 'refresh_token' - 'body')
  );
  return null;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'activity_feed','blog_categories','blog_posts','bookings','clients',
    'contact_submissions','faqs','integration_tokens','invoices','monitored_sites',
    'newsletter_subscribers','pm_projects','pm_tasks','pricing_tiers','process_steps',
    'projects','reviews','services','site_settings','social_links','team_members','values'
  ] loop
    execute format('drop trigger if exists zz_audit on public.%I', t);
    execute format('create trigger zz_audit after insert or update or delete on public.%I for each row execute function public.log_audit()', t);
  end loop;
end $$;
