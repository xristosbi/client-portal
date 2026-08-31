-- Phase 12: allow deleting clients that have invoices.
-- Run this in the Supabase SQL Editor after 0013_agreements.sql.
--
-- Audit of every FK pointing at profiles.id (only the first one needed a
-- change — the rest were already correct):
--   client_invoices.client_id    RESTRICT -> CASCADE  (changed below)
--   projects.client_id           CASCADE   (already; cascades milestones,
--                                           project_files via project_id)
--   support_tickets.client_id    CASCADE   (already; cascades ticket_messages)
--   agreements.client_id         CASCADE   (already)
--   notifications.client_id      CASCADE   (already; cascades notification_reads)
--   notification_reads.client_id CASCADE   (already)
--   project_files.uploaded_by    SET NULL  (kept: the uploader may be the
--                                           admin; the row itself is removed
--                                           through projects -> project_files)
--   ticket_messages.sender_id    SET NULL  (kept: same reasoning — the row is
--                                           removed through support_tickets)
-- income_entries / expense_entries have no client reference (standalone
-- bookkeeping) and team_members has none either, so neither is affected.
--
-- NOTE: cascading removes database rows only. Files in the client-invoices,
-- project-files and agreements buckets are deleted by the admin delete
-- action in app/admin/clients/actions.ts, not by the database.

alter table public.client_invoices
  drop constraint if exists client_invoices_client_id_fkey;

alter table public.client_invoices
  add constraint client_invoices_client_id_fkey
    foreign key (client_id)
    references public.profiles (id)
    on delete cascade;
