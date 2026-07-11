-- Phase 11: client agreements (markdown text or uploaded PDF).
-- Run this in the Supabase SQL Editor after 0012_notifications_unread.sql.

create type public.agreement_content_type as enum ('markdown', 'pdf');

-- Zero or more rows per client; the app treats the most recent row as
-- "the" agreement (no versioning system yet).
create table public.agreements (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  content_type public.agreement_content_type not null,
  content_markdown text,
  file_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agreements_content_present check (
    (content_type = 'markdown' and content_markdown is not null)
    or (content_type = 'pdf' and file_path is not null)
  )
);

create index agreements_client_id_idx on public.agreements (client_id);

alter table public.agreements enable row level security;

create trigger agreements_set_updated_at
  before update on public.agreements
  for each row
  execute function public.set_updated_at();

create policy "agreements_admin_all"
  on public.agreements
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "agreements_client_select_own"
  on public.agreements
  for select
  using (agreements.client_id = auth.uid());

-- Private bucket for agreement PDFs, stored as <client_id>/<uuid>.pdf —
-- same folder-prefix ownership pattern as client-invoices.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('agreements', 'agreements', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;

create policy "agreements_bucket_admin_select"
  on storage.objects
  for select
  using (bucket_id = 'agreements' and public.is_admin());

create policy "agreements_bucket_admin_insert"
  on storage.objects
  for insert
  with check (bucket_id = 'agreements' and public.is_admin());

create policy "agreements_bucket_admin_update"
  on storage.objects
  for update
  using (bucket_id = 'agreements' and public.is_admin())
  with check (bucket_id = 'agreements' and public.is_admin());

create policy "agreements_bucket_admin_delete"
  on storage.objects
  for delete
  using (bucket_id = 'agreements' and public.is_admin());

create policy "agreements_bucket_client_select_own"
  on storage.objects
  for select
  using (
    bucket_id = 'agreements'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
