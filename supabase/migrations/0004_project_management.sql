-- =====================================================================
-- Trellee — internal project tracker (distinct from the public portfolio
-- `projects` table). Admin-only: RLS enabled with no policies; access via the
-- service-role client behind requireOwner().
-- =====================================================================

create table if not exists public.pm_projects (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  client_name   text,
  client_email  text,
  status        text not null default 'active' check (status in ('active','on_hold','done','archived')),
  description   text,
  due_date      date,
  display_order int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.pm_tasks (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.pm_projects(id) on delete cascade,
  title         text not null,
  done          boolean not null default false,
  due_date      date,
  display_order int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create or replace trigger pm_projects_updated
  before update on public.pm_projects
  for each row execute function public.set_updated_at();
create or replace trigger pm_tasks_updated
  before update on public.pm_tasks
  for each row execute function public.set_updated_at();

create index if not exists pm_tasks_project_idx on public.pm_tasks(project_id, display_order);
create index if not exists pm_projects_status_idx on public.pm_projects(status, display_order);

alter table public.pm_projects enable row level security;
alter table public.pm_tasks enable row level security;
