-- Phase 4: subscription tracking on profiles. Amounts are maintained
-- manually for both payment methods; 'stripe_auto' rows will be synced by
-- Stripe webhooks in a future phase.
-- Run this in the Supabase SQL Editor after 0003_finance.sql.

create type public.subscription_status as enum ('active', 'paused', 'cancelled');

create type public.payment_method as enum ('stripe_auto', 'cash_manual');

alter table public.profiles
  add column has_subscription boolean not null default false,
  add column subscription_amount numeric(10, 2)
    check (subscription_amount is null or subscription_amount >= 0),
  add column subscription_status public.subscription_status
    not null default 'active',
  add column payment_method public.payment_method;
