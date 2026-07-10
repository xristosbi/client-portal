-- Phase 9: support tickets + Calendly booking URL.
-- Run this in the Supabase SQL Editor after 0010_fix_project_files_storage_rls.sql.

create type public.ticket_status as enum
  ('open', 'in_progress', 'resolved', 'closed');

create type public.ticket_priority as enum ('low', 'normal', 'high');

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  subject text not null,
  status public.ticket_status not null default 'open',
  priority public.ticket_priority not null default 'normal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index support_tickets_client_id_idx
  on public.support_tickets (client_id);
create index support_tickets_updated_at_idx
  on public.support_tickets (updated_at desc);

create table public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets (id) on delete cascade,
  sender_id uuid references public.profiles (id) on delete set null,
  message text not null,
  created_at timestamptz not null default now()
);

create index ticket_messages_ticket_id_idx
  on public.ticket_messages (ticket_id);

alter table public.support_tickets enable row level security;
alter table public.ticket_messages enable row level security;

create trigger support_tickets_set_updated_at
  before update on public.support_tickets
  for each row
  execute function public.set_updated_at();

-- A new message bumps the parent ticket's updated_at so active
-- conversations sort to the top. SECURITY DEFINER because clients have no
-- UPDATE policy on support_tickets — the trigger must not fail under the
-- caller's RLS.
create or replace function public.touch_ticket_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.support_tickets
  set updated_at = now()
  where id = new.ticket_id;
  return new;
end;
$$;

create trigger ticket_messages_touch_ticket
  after insert on public.ticket_messages
  for each row
  execute function public.touch_ticket_updated_at();

-- NOTE: all columns in subqueries are table-qualified on purpose — an
-- unqualified column that also exists on the inner table silently resolves
-- there (see 0010 for the bug that pattern caused).

create policy "support_tickets_admin_all"
  on public.support_tickets
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "support_tickets_client_select_own"
  on public.support_tickets
  for select
  using (support_tickets.client_id = auth.uid());

-- Clients open tickets only for themselves; a linked project must be
-- their own.
create policy "support_tickets_client_insert_own"
  on public.support_tickets
  for insert
  with check (
    support_tickets.client_id = auth.uid()
    and (
      support_tickets.project_id is null
      or exists (
        select 1 from public.projects
        where projects.id = support_tickets.project_id
          and projects.client_id = auth.uid()
      )
    )
  );

create policy "ticket_messages_admin_all"
  on public.ticket_messages
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "ticket_messages_client_select_own"
  on public.ticket_messages
  for select
  using (
    exists (
      select 1 from public.support_tickets
      where support_tickets.id = ticket_messages.ticket_id
        and support_tickets.client_id = auth.uid()
    )
  );

create policy "ticket_messages_client_insert_own"
  on public.ticket_messages
  for insert
  with check (
    ticket_messages.sender_id = auth.uid()
    and exists (
      select 1 from public.support_tickets
      where support_tickets.id = ticket_messages.ticket_id
        and support_tickets.client_id = auth.uid()
    )
  );

-- Calendly scheduling link, managed from the admin Ρυθμίσεις page.
alter table public.app_settings
  add column calendly_url text;
