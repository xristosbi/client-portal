-- Phase 2: agency team members (informational entries, no portal login).
-- Kept in their own table so client-count logic on profiles stays untouched.
-- Run this in the Supabase SQL Editor after 0001_profiles.sql.

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  position text,
  created_at timestamptz not null default now()
);

alter table public.team_members enable row level security;

create policy "team_members_admin_all"
  on public.team_members
  for all
  using (public.is_admin())
  with check (public.is_admin());
