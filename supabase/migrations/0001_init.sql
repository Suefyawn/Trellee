-- =====================================================================
-- Trellee — initial schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- Designed to match the CMS data model documented in /design/*.html comments.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- helper: keep updated_at fresh on every UPDATE
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- site_settings (single-row config, keyed by `id = 1`)
-- ---------------------------------------------------------------------
create table if not exists public.site_settings (
  id              int primary key default 1 check (id = 1),
  company_name    text not null default 'Trellee',
  tagline         text default 'Full-stack digital agency',
  email           text default 'hello@trellee.com',
  city            text default 'Miami, FL',
  whatsapp_url    text,
  calendar_url    text,
  response_time   text default 'Replies within 4 hours, business days',

  -- Hero (homepage)
  hero_eyebrow    text default 'A FULL-STACK DIGITAL AGENCY',
  hero_lede       text default 'agency for teams that ship',
  ticker_words    jsonb not null default '["websites","brands","CRMs","mobile apps","ad funnels","AI agents","SEO wins","real leads"]',
  hero_body       text default 'Design, code, and growth — built in one team. From the first commit to the first conversion.',
  hero_cta_label  text default 'Book a call',
  hero_cta_href   text default '/book',

  -- Stats (about + homepage)
  stats           jsonb not null default '[
    {"label":"Projects shipped","value":"120","suffix":"+","context":"since 2019"},
    {"label":"Client CSAT","value":"4.9","suffix":"/5","context":"across 80+ reviews"},
    {"label":"Repeat rate","value":"68","suffix":"%","context":"clients who return"},
    {"label":"Open slots / qtr","value":"6","suffix":"","context":"capacity gated, no rush jobs"}
  ]',

  -- Booking CTA section
  booking_quarter   text default 'Q3 2026',
  booking_slots_open int default 4,
  cta_heading       text default 'Tell us what you''re building.',
  cta_subheading    text default 'A 30-minute intro call. No prep needed, no slide deck on our end. Bring the problem, we''ll bring the questions.',
  cta_benefits      jsonb default '["No sales script","Same-day scoping notes","Fixed-fee proposal within 72h"]',

  -- Newsletter
  newsletter_heading    text default 'The build log, in your inbox.',
  newsletter_subheading text default 'One short note every other week — what we shipped, what broke, what we''re reading. No fluff.',

  -- Pages (rich text content for about, contact intros, etc.)
  about_hero_headline    text,
  about_hero_subheadline text,
  about_origin_story     text,
  about_philosophy       text,

  contact_intro          text,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create or replace trigger site_settings_updated
  before update on public.site_settings
  for each row execute function public.set_updated_at();

insert into public.site_settings (id) values (1) on conflict do nothing;

-- ---------------------------------------------------------------------
-- services
-- ---------------------------------------------------------------------
create table if not exists public.services (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  short_title     text,                       -- bento tile label
  icon            text,                       -- lucide icon name
  category        text,                       -- e.g. "Engineering", "Growth"
  tags            text[] not null default '{}',
  tile_size       text not null default 'sm' check (tile_size in ('sm','md','lg','xl')),
  featured        boolean not null default false,
  display_order   int not null default 0,
  hero_snippet    text,                       -- short hero subtitle
  summary         text,                       -- bento tile body
  problem_statement text,                     -- service detail "the problem" section
  approach_pillars jsonb default '[]',        -- [{title,description,icon}]
  deliverables    jsonb default '[]',         -- [{title,description,icon}]
  hero_code       text,                       -- optional code-window snippet for hero
  hero_code_lang  text default 'typescript',
  meta_title      text,
  meta_description text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create or replace trigger services_updated
  before update on public.services
  for each row execute function public.set_updated_at();

create index if not exists services_slug_idx on public.services(slug);
create index if not exists services_featured_idx on public.services(featured, display_order);

-- ---------------------------------------------------------------------
-- pricing_tiers (per-service)
-- ---------------------------------------------------------------------
create table if not exists public.pricing_tiers (
  id            uuid primary key default gen_random_uuid(),
  service_id    uuid references public.services(id) on delete cascade,
  name          text not null,
  price         text not null,                -- string so we can show "$8k" or "Custom"
  price_suffix  text,                         -- e.g. "/project", "/mo"
  description   text,
  features      jsonb not null default '[]',  -- string[]
  highlighted   boolean not null default false,
  cta_label     text default 'Book a call',
  cta_href      text default '/book',
  display_order int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create or replace trigger pricing_tiers_updated
  before update on public.pricing_tiers
  for each row execute function public.set_updated_at();

create index if not exists pricing_tiers_service_idx on public.pricing_tiers(service_id, display_order);

-- ---------------------------------------------------------------------
-- faqs
-- ---------------------------------------------------------------------
create table if not exists public.faqs (
  id          uuid primary key default gen_random_uuid(),
  question    text not null,
  answer      text not null,                  -- markdown or plain text
  category    text,                           -- 'general' | service slug
  service_id  uuid references public.services(id) on delete set null,
  display_order int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create or replace trigger faqs_updated
  before update on public.faqs
  for each row execute function public.set_updated_at();

create index if not exists faqs_category_idx on public.faqs(category, display_order);

-- ---------------------------------------------------------------------
-- clients (logo bar)
-- ---------------------------------------------------------------------
create table if not exists public.clients (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  logo_url    text,
  website_url text,
  featured    boolean not null default false,
  display_order int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create or replace trigger clients_updated
  before update on public.clients
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- projects (case studies)
-- ---------------------------------------------------------------------
create table if not exists public.projects (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  client_name     text,
  client_id       uuid references public.clients(id) on delete set null,
  summary         text,                       -- card description
  hero_eyebrow    text,                       -- "CASE STUDY · Q4 2025"
  brief           text,                       -- "the brief" section
  approach        text,                       -- "the approach" section
  outcome         text,                       -- "the results" section
  cover_url       text,
  thumbnail_url   text,
  gallery         jsonb default '[]',         -- [{url,caption,type:'image'|'mock'}]
  metrics         jsonb default '[]',         -- [{label,value,context}]
  technologies    jsonb default '[]',         -- [{name,category}]
  service_categories text[] not null default '{}',  -- service slugs
  featured        boolean not null default false,
  featured_order  int not null default 0,
  status          text not null default 'published' check (status in ('draft','published')),
  published_at    timestamptz default now(),
  meta_title      text,
  meta_description text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create or replace trigger projects_updated
  before update on public.projects
  for each row execute function public.set_updated_at();

create index if not exists projects_slug_idx on public.projects(slug);
create index if not exists projects_status_idx on public.projects(status, published_at desc);
create index if not exists projects_featured_idx on public.projects(featured, featured_order);

-- ---------------------------------------------------------------------
-- reviews (text + video)
-- ---------------------------------------------------------------------
create table if not exists public.reviews (
  id            uuid primary key default gen_random_uuid(),
  type          text not null default 'text' check (type in ('text','video')),
  author_name   text not null,
  author_role   text,
  author_company text,
  author_avatar_url text,
  quote         text,                         -- for text reviews
  rating        smallint check (rating between 1 and 5),
  video_url     text,                         -- for video reviews
  video_thumbnail_url text,
  duration      text,                         -- "1:24"
  project_id    uuid references public.projects(id) on delete set null,
  featured      boolean not null default false,
  display_order int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create or replace trigger reviews_updated
  before update on public.reviews
  for each row execute function public.set_updated_at();

create index if not exists reviews_featured_idx on public.reviews(featured, display_order);

-- ---------------------------------------------------------------------
-- process_steps (shared homepage process)
-- ---------------------------------------------------------------------
create table if not exists public.process_steps (
  id            uuid primary key default gen_random_uuid(),
  step_number   text not null,                -- '01' .. '05'
  phase_label   text,                         -- 'DISCOVERY' / 'BUILD' etc.
  title         text not null,
  description   text not null,
  duration      text,                         -- 'Week 1' etc.
  service_id    uuid references public.services(id) on delete cascade,  -- null = global
  display_order int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create or replace trigger process_steps_updated
  before update on public.process_steps
  for each row execute function public.set_updated_at();

create index if not exists process_steps_service_idx on public.process_steps(service_id, display_order);

-- ---------------------------------------------------------------------
-- values (about page)
-- ---------------------------------------------------------------------
create table if not exists public.values (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text not null,
  icon          text,
  display_order int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create or replace trigger values_updated
  before update on public.values
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- team_members
-- ---------------------------------------------------------------------
create table if not exists public.team_members (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  role          text,
  bio           text,
  avatar_url    text,
  links         jsonb default '[]',           -- [{label,url}]
  display_order int not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create or replace trigger team_members_updated
  before update on public.team_members
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- activity_feed (homepage live "build log")
-- ---------------------------------------------------------------------
create table if not exists public.activity_feed (
  id            uuid primary key default gen_random_uuid(),
  message       text not null,
  badge         text,                         -- e.g. 'shipped', 'deployed'
  href          text,
  occurred_at   timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create index if not exists activity_feed_occurred_idx on public.activity_feed(occurred_at desc);

-- ---------------------------------------------------------------------
-- social_links
-- ---------------------------------------------------------------------
create table if not exists public.social_links (
  id            uuid primary key default gen_random_uuid(),
  platform      text not null,                -- 'x','linkedin','github','instagram','dribbble','youtube'
  url           text not null,
  display_order int not null default 0,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- blog_categories
-- ---------------------------------------------------------------------
create table if not exists public.blog_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  display_order int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create or replace trigger blog_categories_updated
  before update on public.blog_categories
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- blog_posts
-- ---------------------------------------------------------------------
create table if not exists public.blog_posts (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  excerpt       text,
  body          text,                          -- markdown
  cover_url     text,
  category_id   uuid references public.blog_categories(id) on delete set null,
  author_id     uuid references public.team_members(id) on delete set null,
  reading_time  int,                           -- minutes
  featured      boolean not null default false,
  status        text not null default 'draft' check (status in ('draft','published')),
  published_at  timestamptz,
  meta_title    text,
  meta_description text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create or replace trigger blog_posts_updated
  before update on public.blog_posts
  for each row execute function public.set_updated_at();

create index if not exists blog_posts_slug_idx on public.blog_posts(slug);
create index if not exists blog_posts_status_idx on public.blog_posts(status, published_at desc);

-- ---------------------------------------------------------------------
-- bookings (form submissions from /book)
-- ---------------------------------------------------------------------
create table if not exists public.bookings (
  id            uuid primary key default gen_random_uuid(),
  service_id    uuid references public.services(id) on delete set null,
  service_slug  text,
  time_slot_at  timestamptz,
  timezone      text,
  name          text not null,
  email         text not null,
  company       text,
  phone         text,
  notes         text,
  status        text not null default 'new' check (status in ('new','contacted','scheduled','won','lost','cancelled')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create or replace trigger bookings_updated
  before update on public.bookings
  for each row execute function public.set_updated_at();

create index if not exists bookings_status_idx on public.bookings(status, created_at desc);

-- ---------------------------------------------------------------------
-- contact_submissions
-- ---------------------------------------------------------------------
create table if not exists public.contact_submissions (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null,
  company       text,
  budget        text,
  services      text[] default '{}',
  message       text not null,
  source        text default 'contact',
  status        text not null default 'new' check (status in ('new','contacted','closed','spam')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create or replace trigger contact_submissions_updated
  before update on public.contact_submissions
  for each row execute function public.set_updated_at();

create index if not exists contact_submissions_status_idx on public.contact_submissions(status, created_at desc);

-- ---------------------------------------------------------------------
-- Row Level Security
-- Strategy:
--   - Public (anon) can SELECT only published / non-form-submission content.
--   - Anonymous users can INSERT into bookings + contact_submissions (form submits).
--   - Owner (auth.email() = ADMIN_OWNER_EMAIL) can do everything via service role.
-- Server-side admin actions use the service-role key, which bypasses RLS — so
-- these policies focus on what the public anon key is allowed to see/do.
-- ---------------------------------------------------------------------
alter table public.site_settings        enable row level security;
alter table public.services             enable row level security;
alter table public.pricing_tiers        enable row level security;
alter table public.faqs                 enable row level security;
alter table public.clients              enable row level security;
alter table public.projects             enable row level security;
alter table public.reviews              enable row level security;
alter table public.process_steps        enable row level security;
alter table public.values               enable row level security;
alter table public.team_members         enable row level security;
alter table public.activity_feed        enable row level security;
alter table public.social_links         enable row level security;
alter table public.blog_categories      enable row level security;
alter table public.blog_posts           enable row level security;
alter table public.bookings             enable row level security;
alter table public.contact_submissions  enable row level security;

-- Public read access on marketing tables
drop policy if exists "public read site_settings"   on public.site_settings;
create policy "public read site_settings"   on public.site_settings   for select using (true);
drop policy if exists "public read services"        on public.services;
create policy "public read services"        on public.services        for select using (true);
drop policy if exists "public read pricing_tiers"   on public.pricing_tiers;
create policy "public read pricing_tiers"   on public.pricing_tiers   for select using (true);
drop policy if exists "public read faqs"            on public.faqs;
create policy "public read faqs"            on public.faqs            for select using (true);
drop policy if exists "public read clients"         on public.clients;
create policy "public read clients"         on public.clients         for select using (true);
drop policy if exists "public read process_steps"   on public.process_steps;
create policy "public read process_steps"   on public.process_steps   for select using (true);
drop policy if exists "public read values"          on public.values;
create policy "public read values"          on public.values          for select using (true);
drop policy if exists "public read team_members"    on public.team_members;
create policy "public read team_members"    on public.team_members    for select using (active = true);
drop policy if exists "public read activity_feed"   on public.activity_feed;
create policy "public read activity_feed"   on public.activity_feed   for select using (true);
drop policy if exists "public read social_links"    on public.social_links;
create policy "public read social_links"    on public.social_links    for select using (true);
drop policy if exists "public read blog_categories" on public.blog_categories;
create policy "public read blog_categories" on public.blog_categories for select using (true);
drop policy if exists "public read reviews"         on public.reviews;
create policy "public read reviews"         on public.reviews         for select using (true);

-- Published-only public reads
drop policy if exists "public read published projects" on public.projects;
create policy "public read published projects"
  on public.projects for select
  using (status = 'published');

drop policy if exists "public read published blog_posts" on public.blog_posts;
create policy "public read published blog_posts"
  on public.blog_posts for select
  using (status = 'published' and published_at <= now());

-- Anonymous form submissions
drop policy if exists "anyone can submit a booking" on public.bookings;
create policy "anyone can submit a booking"
  on public.bookings for insert
  with check (true);

drop policy if exists "anyone can submit contact form" on public.contact_submissions;
create policy "anyone can submit contact form"
  on public.contact_submissions for insert
  with check (true);

-- Bookings/contact reads are admin-only (service role bypasses RLS).
-- No SELECT policy for anon = no anon reads.

-- ---------------------------------------------------------------------
-- Storage buckets (run AFTER you create them in Supabase UI or via dashboard)
-- These INSERTs are idempotent.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
  values ('media','media',true)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('videos','videos',true)
  on conflict (id) do nothing;

-- NOTE: public buckets serve objects via their public URL WITHOUT an RLS
-- SELECT policy. A broad "public read" select policy only adds object listing/
-- enumeration (Supabase advisor 0025), so we intentionally do not create one.
-- Admin uploads go through the service-role client, which bypasses RLS.

-- Authenticated users can write — admin server actions use service role anyway,
-- but this allows direct uploads from the admin UI via the user's session.
drop policy if exists "auth write media" on storage.objects;
create policy "auth write media"
  on storage.objects for insert
  with check (bucket_id = 'media' and auth.role() = 'authenticated');

drop policy if exists "auth update media" on storage.objects;
create policy "auth update media"
  on storage.objects for update
  using (bucket_id = 'media' and auth.role() = 'authenticated')
  with check (bucket_id = 'media' and auth.role() = 'authenticated');

drop policy if exists "auth delete media" on storage.objects;
create policy "auth delete media"
  on storage.objects for delete
  using (bucket_id = 'media' and auth.role() = 'authenticated');

drop policy if exists "auth write videos" on storage.objects;
create policy "auth write videos"
  on storage.objects for insert
  with check (bucket_id = 'videos' and auth.role() = 'authenticated');

drop policy if exists "auth update videos" on storage.objects;
create policy "auth update videos"
  on storage.objects for update
  using (bucket_id = 'videos' and auth.role() = 'authenticated')
  with check (bucket_id = 'videos' and auth.role() = 'authenticated');

drop policy if exists "auth delete videos" on storage.objects;
create policy "auth delete videos"
  on storage.objects for delete
  using (bucket_id = 'videos' and auth.role() = 'authenticated');
