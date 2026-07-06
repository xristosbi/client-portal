-- Phase 6: global welcome video/message shown on the client portal home
-- page, plus a reserved per-client personalized video column.
-- Run this in the Supabase SQL Editor after 0005_projects.sql.

-- Singleton config row (id is pinned to 1 by the check constraint).
create table public.app_settings (
  id integer primary key default 1,
  welcome_video_url text,
  welcome_message text,
  updated_at timestamptz not null default now(),
  constraint app_settings_singleton check (id = 1)
);

insert into public.app_settings (id) values (1);

alter table public.app_settings enable row level security;

-- Every logged-in client needs to read the welcome video/message on their
-- portal home page, so SELECT is open to any authenticated user; only
-- admins may write. (Two policies, not one "for all", so the SELECT grant
-- doesn't also open up writes.)
create policy "app_settings_select_authenticated"
  on public.app_settings
  for select
  using (auth.uid() is not null);

create policy "app_settings_admin_write"
  on public.app_settings
  for all
  using (public.is_admin())
  with check (public.is_admin());

create trigger app_settings_set_updated_at
  before update on public.app_settings
  for each row
  execute function public.set_updated_at();

-- Reserved for a future per-client personalized welcome video; not read
-- or written anywhere yet except the /portal fallback logic.
alter table public.profiles
  add column personal_welcome_video_url text;
