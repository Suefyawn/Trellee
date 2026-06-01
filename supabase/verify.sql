-- =====================================================================
-- Trellee — post-migration verification
-- Read-only. Run AFTER 0001_init.sql against the new project to confirm the
-- schema, RLS, policies, and storage landed correctly. Every row should read
-- as PASS. Safe to run any time (makes no changes).
-- =====================================================================

-- 1. All 16 application tables exist in public.
select
  '16 app tables present' as check,
  count(*) as found,
  case when count(*) = 16 then 'PASS' else 'FAIL' end as status
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'site_settings','services','pricing_tiers','faqs','clients','projects',
    'reviews','process_steps','values','team_members','activity_feed',
    'social_links','blog_categories','blog_posts','bookings','contact_submissions'
  );

-- 2. RLS is enabled on every application table (expect 0 offenders).
select
  'RLS enabled on all app tables' as check,
  count(*) as tables_without_rls,
  case when count(*) = 0 then 'PASS' else 'FAIL' end as status
from pg_tables t
where t.schemaname = 'public'
  and t.tablename in (
    'site_settings','services','pricing_tiers','faqs','clients','projects',
    'reviews','process_steps','values','team_members','activity_feed',
    'social_links','blog_categories','blog_posts','bookings','contact_submissions'
  )
  and t.rowsecurity = false;

-- 3. bookings + contact_submissions have NO select policy (admin-only reads).
select
  'no anon SELECT on lead tables' as check,
  count(*) as select_policies,
  case when count(*) = 0 then 'PASS' else 'FAIL' end as status
from pg_policies
where schemaname = 'public'
  and tablename in ('bookings','contact_submissions')
  and cmd = 'SELECT';

-- 4. Both storage buckets exist and are public.
select
  'media + videos buckets public' as check,
  count(*) as found,
  case when count(*) = 2 then 'PASS' else 'FAIL' end as status
from storage.buckets
where id in ('media','videos') and public = true;

-- 5. The singleton site_settings row exists.
select
  'site_settings row id=1' as check,
  count(*) as found,
  case when count(*) = 1 then 'PASS' else 'FAIL' end as status
from public.site_settings where id = 1;

-- 6. Quick inventory: policy + index counts (informational, no pass/fail).
select 'policy count (public schema)' as info, count(*) as value
from pg_policies where schemaname = 'public';
