-- Phase 10: unread-ticket tracking + notifications system.
-- Run this in the Supabase SQL Editor after 0011_support.sql.

-- ============================================================
-- A) Unread support tickets
-- ============================================================

alter table public.support_tickets
  add column client_last_read_at timestamptz,
  add column admin_last_read_at timestamptz;

-- Marks a ticket read for the caller. SECURITY DEFINER because clients
-- intentionally have no UPDATE policy on support_tickets; ownership is
-- checked inside for the client branch.
create or replace function public.mark_ticket_read(p_ticket_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    update public.support_tickets
    set admin_last_read_at = now()
    where id = p_ticket_id;
  else
    update public.support_tickets
    set client_last_read_at = now()
    where id = p_ticket_id
      and client_id = auth.uid();
  end if;
end;
$$;

-- Unread = at least one message from the other party newer than the
-- viewer's last_read_at (null last_read_at counts everything).
-- SECURITY INVOKER on purpose: RLS scopes tickets/messages to the caller.
create or replace function public.unread_ticket_count()
returns integer
language sql
stable
set search_path = public
as $$
  select count(*)::int
  from public.support_tickets t
  where exists (
    select 1
    from public.ticket_messages m
    where m.ticket_id = t.id
      and m.created_at > coalesce(
        case when public.is_admin() then t.admin_last_read_at
             else t.client_last_read_at end,
        'epoch'::timestamptz
      )
      and (
        case when public.is_admin() then
          m.sender_id is null
          or not exists (
            select 1 from public.profiles p
            where p.id = m.sender_id and p.role = 'admin'
          )
        else
          m.sender_id is not null and m.sender_id <> auth.uid()
        end
      )
  );
$$;

-- ============================================================
-- B) Notifications
-- ============================================================

create type public.notification_type as enum
  ('info', 'payment', 'milestone', 'support');

-- client_id null = broadcast to all clients.
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.profiles (id) on delete cascade,
  title text not null,
  message text not null,
  type public.notification_type not null default 'info',
  created_at timestamptz not null default now()
);

create index notifications_client_id_idx
  on public.notifications (client_id);
create index notifications_created_at_idx
  on public.notifications (created_at desc);

-- Per-client read state (broadcasts are read independently per client).
create table public.notification_reads (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null
    references public.notifications (id) on delete cascade,
  client_id uuid not null references public.profiles (id) on delete cascade,
  read_at timestamptz not null default now(),
  unique (notification_id, client_id)
);

alter table public.notifications enable row level security;
alter table public.notification_reads enable row level security;

create policy "notifications_admin_all"
  on public.notifications
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "notifications_client_select_own_or_broadcast"
  on public.notifications
  for select
  using (
    notifications.client_id = auth.uid()
    or notifications.client_id is null
  );

create policy "notification_reads_admin_all"
  on public.notification_reads
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "notification_reads_client_select_own"
  on public.notification_reads
  for select
  using (notification_reads.client_id = auth.uid());

create policy "notification_reads_client_insert_own"
  on public.notification_reads
  for insert
  with check (
    notification_reads.client_id = auth.uid()
    and exists (
      select 1 from public.notifications
      where notifications.id = notification_reads.notification_id
        and (
          notifications.client_id = auth.uid()
          or notifications.client_id is null
        )
    )
  );

-- Needed for upsert (insert ... on conflict do update on read_at).
create policy "notification_reads_client_update_own"
  on public.notification_reads
  for update
  using (notification_reads.client_id = auth.uid())
  with check (notification_reads.client_id = auth.uid());

-- Unread notifications for the calling client. SECURITY INVOKER: RLS
-- limits visibility to own + broadcast rows.
create or replace function public.unread_notification_count()
returns integer
language sql
stable
set search_path = public
as $$
  select count(*)::int
  from public.notifications n
  where not exists (
    select 1 from public.notification_reads r
    where r.notification_id = n.id
      and r.client_id = auth.uid()
  );
$$;
