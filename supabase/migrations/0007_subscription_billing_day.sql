-- Phase 7: day-of-month subscription billing, used to compute a real
-- "next payment date" on the client portal home page.
-- Run this in the Supabase SQL Editor after 0006_welcome_video.sql.

alter table public.profiles
  add column subscription_billing_day integer
    check (
      subscription_billing_day is null
      or subscription_billing_day between 1 and 31
    );
