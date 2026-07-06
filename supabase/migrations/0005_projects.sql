-- Phase 5: projects + milestones, and client read access to their own
-- invoices (table + storage) for the client portal.
-- Run this in the Supabase SQL Editor after 0004_subscriptions.sql.

create type public.project_status as enum
  ('onboarding', 'in_progress', 'review', 'completed', 'paused');

create type public.milestone_status as enum
  ('pending', 'in_progress', 'completed');

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text,
  status public.project_status not null default 'onboarding',
  start_date date,
  target_end_date date,
  created_at timestamptz not null default now()
);

create index projects_client_id_idx on public.projects (client_id);

create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  description text,
  due_date date,
  status public.milestone_status not null default 'pending',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index milestones_project_id_idx on public.milestones (project_id);

alter table public.projects enable row level security;
alter table public.milestones enable row level security;

create policy "projects_admin_all"
  on public.projects
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "projects_client_select_own"
  on public.projects
  for select
  using (client_id = auth.uid());

create policy "milestones_admin_all"
  on public.milestones
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "milestones_client_select_own"
  on public.milestones
  for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = milestones.project_id
        and projects.client_id = auth.uid()
    )
  );

-- Clients may read ONLY their own invoice rows (admin policies from 0003
-- remain in place for everything else).
create policy "client_invoices_client_select_own"
  on public.client_invoices
  for select
  using (client_id = auth.uid());

-- Invoice PDFs are stored under <client_id>/<uuid>.pdf, so the first path
-- segment gates client access to their own files (needed for signed URLs).
create policy "client_invoices_bucket_client_select_own"
  on storage.objects
  for select
  using (
    bucket_id = 'client-invoices'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
