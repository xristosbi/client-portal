-- Phase 8 hotfix 2: the client policies on the project-files bucket
-- referenced the unqualified column `name` inside an EXISTS subquery over
-- public.projects — and projects has its own `name` column, so Postgres
-- resolved it to projects.name (the project title!) instead of
-- storage.objects.name (the object key). storage.foldername(<title>) is an
-- empty array, [1] is NULL, so the EXISTS was always false and every
-- client upload/read failed RLS ("new row violates row-level security
-- policy"). Qualify the column as storage.objects.name.
-- Run this in the Supabase SQL Editor after 0009_fix_project_files_mime_types.sql.

drop policy "project_files_bucket_client_select" on storage.objects;
drop policy "project_files_bucket_client_insert" on storage.objects;

create policy "project_files_bucket_client_select"
  on storage.objects
  for select
  using (
    bucket_id = 'project-files'
    and exists (
      select 1 from public.projects
      where projects.id::text = (storage.foldername(storage.objects.name))[1]
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
      where projects.id::text = (storage.foldername(storage.objects.name))[1]
        and projects.client_id = auth.uid()
    )
  );
