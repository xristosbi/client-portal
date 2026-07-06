-- Phase 3: manual bookkeeping — income, expenses, client invoices (myDATA
-- records, not Stripe) + private storage bucket for invoice PDFs.
-- Run this in the Supabase SQL Editor after 0002_team_members.sql.

create table public.income_entries (
  id uuid primary key default gen_random_uuid(),
  amount numeric(12, 2) not null check (amount >= 0),
  description text not null,
  category text,
  entry_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index income_entries_entry_date_idx
  on public.income_entries (entry_date);

create table public.expense_entries (
  id uuid primary key default gen_random_uuid(),
  amount numeric(12, 2) not null check (amount >= 0),
  description text not null,
  category text,
  entry_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index expense_entries_entry_date_idx
  on public.expense_entries (entry_date);

-- Invoices already issued via myDATA; the PDF lives in the private
-- 'client-invoices' storage bucket. ON DELETE RESTRICT protects the
-- financial record: a client with invoices cannot be deleted by accident.
create table public.client_invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete restrict,
  amount numeric(12, 2) not null check (amount >= 0),
  description text not null,
  invoice_date date not null default current_date,
  file_path text not null,
  created_at timestamptz not null default now()
);

create index client_invoices_client_id_idx
  on public.client_invoices (client_id);

alter table public.income_entries enable row level security;
alter table public.expense_entries enable row level security;
alter table public.client_invoices enable row level security;

create policy "income_entries_admin_all"
  on public.income_entries
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "expense_entries_admin_all"
  on public.expense_entries
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Admin-only for now; a later phase adds a client-side SELECT policy so
-- each client sees only their own invoices.
create policy "client_invoices_admin_all"
  on public.client_invoices
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Private bucket for invoice PDFs.
insert into storage.buckets (id, name, public)
values ('client-invoices', 'client-invoices', false)
on conflict (id) do nothing;

create policy "client_invoices_bucket_admin_select"
  on storage.objects
  for select
  using (bucket_id = 'client-invoices' and public.is_admin());

create policy "client_invoices_bucket_admin_insert"
  on storage.objects
  for insert
  with check (bucket_id = 'client-invoices' and public.is_admin());

create policy "client_invoices_bucket_admin_update"
  on storage.objects
  for update
  using (bucket_id = 'client-invoices' and public.is_admin())
  with check (bucket_id = 'client-invoices' and public.is_admin());

create policy "client_invoices_bucket_admin_delete"
  on storage.objects
  for delete
  using (bucket_id = 'client-invoices' and public.is_admin());
