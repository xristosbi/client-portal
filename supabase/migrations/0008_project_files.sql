-- Phase 8: project files (client <-> admin file exchange per project).
-- Run this in the Supabase SQL Editor after 0007_subscription_billing_day.sql.

create type public.project_file_type as enum ('image', 'video', 'document', 'other');

create table public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  uploaded_by uuid references public.profiles (id) on delete set null,
  file_name text not null,
  file_path text not null,
  file_type public.project_file_type not null default 'other',
  file_size bigint not null check (file_size >= 0),
  notes text,
  is_from_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create index project_files_project_id_idx on public.project_files (project_id);

alter table public.project_files enable row level security;

create policy "project_files_admin_all"
  on public.project_files
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "project_files_client_select_own"
  on public.project_files
  for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_files.project_id
        and projects.client_id = auth.uid()
    )
  );

-- Clients may only add files to their own project, tagged as their own
-- upload (never impersonating an admin upload).
create policy "project_files_client_insert_own"
  on public.project_files
  for insert
  with check (
    uploaded_by = auth.uid()
    and is_from_admin = false
    and exists (
      select 1 from public.projects
      where projects.id = project_files.project_id
        and projects.client_id = auth.uid()
    )
  );

-- Private bucket for project files. file_size_limit is a single bucket-wide
-- cap (100MB, matching the largest allowed upload type); the smaller 20MB
-- limit for non-video files is enforced client-side, not by the bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-files',
  'project-files',
  false,
  104857600,
  array[
    'image/*',
    'video/*',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do nothing;

create policy "project_files_bucket_admin_select"
  on storage.objects
  for select
  using (bucket_id = 'project-files' and public.is_admin());

create policy "project_files_bucket_admin_insert"
  on storage.objects
  for insert
  with check (bucket_id = 'project-files' and public.is_admin());

create policy "project_files_bucket_admin_update"
  on storage.objects
  for update
  using (bucket_id = 'project-files' and public.is_admin())
  with check (bucket_id = 'project-files' and public.is_admin());

create policy "project_files_bucket_admin_delete"
  on storage.objects
  for delete
  using (bucket_id = 'project-files' and public.is_admin());

-- Files are stored as <project_id>/<uuid>-<filename>, so the first path
-- segment gates client access to their own project's folder only.
create policy "project_files_bucket_client_select"
  on storage.objects
  for select
  using (
    bucket_id = 'project-files'
    and exists (
      select 1 from public.projects
      where projects.id::text = (storage.foldername(name))[1]
        and projects.client_id = auth.uid()
    )
  );

create policy "project_files_bucket_client_insert"
  on storage.objects
  for insert
  with check (
    bucket_id = 'project-files'
    and exists (
      select 1 from public.projects
      where projects.id::text = (storage.foldername(name))[1]
        and projects.client_id = auth.uid()
    )
  );
