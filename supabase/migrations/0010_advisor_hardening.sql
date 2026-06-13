-- Addresses Supabase advisor findings (security + performance).
--
-- 1. log_audit() is a SECURITY DEFINER *trigger* function. It was reachable as
--    a public RPC (/rest/v1/rpc/log_audit) because functions default to
--    EXECUTE for PUBLIC. Triggers fire regardless of EXECUTE grants, so
--    revoking it closes the RPC surface without affecting the audit triggers.
revoke execute on function public.log_audit() from public, anon, authenticated;

-- 2. Covering indexes for foreign keys flagged by the performance advisor
--    (unindexed FKs force sequential scans on the referenced side and slow
--    cascade/lookup operations). IF NOT EXISTS keeps this re-runnable.
create index if not exists blog_posts_author_id_idx   on public.blog_posts (author_id);
create index if not exists blog_posts_category_id_idx on public.blog_posts (category_id);
create index if not exists bookings_service_id_idx    on public.bookings (service_id);
create index if not exists faqs_service_id_idx        on public.faqs (service_id);
create index if not exists projects_client_id_idx     on public.projects (client_id);
create index if not exists reviews_project_id_idx     on public.reviews (project_id);

-- Note: the "RLS enabled, no policy" advisories on audit_log,
-- integration_tokens, invoices, monitored_sites, newsletter_subscribers,
-- pm_projects and pm_tasks are intentional — those tables are service-role-only
-- by design (see 0008/0009). Deny-all to anon/authenticated is the goal, so no
-- policies are added here.
