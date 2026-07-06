# Imperial Automations — Client Portal

Premium client portal for Imperial Automations (AI automation agency). Clients
log in with credentials issued by the agency and see only their own data; the
admin has full visibility across all clients.

**Stack:** Next.js 14 (App Router, TypeScript) · Supabase (Auth, Postgres, RLS,
Storage) · Stripe · Tailwind CSS + shadcn/ui · Resend · Vercel

All user-facing UI text is in **Greek**.

## Phase 6 (current)

- `app_settings` singleton table (welcome_video_url, welcome_message);
  `profiles.personal_welcome_video_url` reserved for a future per-client
  video, not used yet
- New admin page `/admin/settings` ("Ρυθμίσεις") to edit the global
  welcome video URL and message
- `/portal` home page rebuilt: welcome header, welcome video (personal
  override → global fallback → nothing if neither set; supports
  YouTube/Vimeo/Loom embeds and direct video files), welcome message,
  project status + next-milestone card (unchanged), and a 2-card
  quick-glance row (Επόμενη Πληρωμή from active subscription data,
  Τελευταία Ειδοποίηση placeholder since notifications aren't built yet)
- Migration: `supabase/migrations/0006_welcome_video.sql`
- Note: `app_settings` RLS deviates slightly from "admin-only" as
  specified — SELECT is open to any authenticated user (required so
  clients can read the video/message on their own portal page), while
  INSERT/UPDATE/DELETE remain admin-only

## Phase 5

- Edit + delete added across all remaining admin tables: Έσοδα, Έξοδα
  (edit dialog + confirm-delete), Πελάτες (delete blocked with a friendly
  message if the client has invoices — `client_invoices` is
  `ON DELETE RESTRICT`; otherwise removes both the profile and the auth
  user), Προσωπικό (edit + delete). One shared `ConfirmDeleteDialog`
  powers every delete confirmation.
- `projects` + `milestones` tables with RLS (admin full access, clients
  read only their own project's rows)
- New admin page `/admin/clients/[id]`: create/edit a client's project,
  manage milestones (add/edit/delete/reorder with up-down buttons), and
  a read-only view of that client's invoices
- Client portal restructured under `/portal` (replacing `/dashboard`):
  - `/portal` — welcome, project status + next-milestone preview, or an
    empty state if no project yet
  - `/portal/project` — real project details + vertical milestone
    timeline
  - `/portal/invoices` — the client's own `client_invoices` rows only
    (RLS-enforced), with 1-hour signed PDF links
  - `/portal/files`, `/portal/agreement`, `/portal/notifications`,
    `/portal/support` — still "Σύντομα διαθέσιμο" placeholders
- Migration: `supabase/migrations/0005_projects.sql`

## Phase 4

- Subscription tracking on `profiles` (has_subscription, amount, status,
  payment method — Stripe auto vs cash/manual, both entered manually for
  now; Stripe webhook sync comes in a later phase)
- Νέος Πελάτης form gets subscription fields; Πελάτες table gets a
  Συνδρομή column and an Επεξεργασία dialog per client
- MRR card on Επισκόπηση sums active subscriptions (both methods) with a
  Stripe/Μετρητά breakdown
- Έσοδα/Έξοδα amounts color-coded green/red with +/− indicators
- Migration: `supabase/migrations/0004_subscriptions.sql`

## Phase 3

- Επισκόπηση: single "Έσοδα" card with a period dropdown (Σήμερα /
  Εβδομάδα / Μήνας / Τρίμηνο / Έτος / Σύνολο) fed by `income_entries`
- Πληρωμές rebuilt as internal bookkeeping (myDATA records, not Stripe):
  Έσοδα + Έξοδα manual entries, and Τιμολόγια Πελατών with PDF upload to
  the private `client-invoices` storage bucket (signed URLs for viewing)
- Migration `supabase/migrations/0003_finance.sql` adds
  `income_entries`, `expense_entries`, `client_invoices`, the storage
  bucket and admin-only RLS for all of them

## Phase 2

- Admin sidebar: Επισκόπηση, Πελάτες, Προσωπικό, Πληρωμές, Συνομιλίες
- Overview redesigned as the stats dashboard (active clients, MRR and
  revenue-breakdown placeholders, chart empty state — Stripe fills these in
  a later phase)
- Manual client creation from the admin panel (service-role server action,
  one-time visible temporary password)
- `team_members` table + Προσωπικό page (informational entries, no login)
- Payments page shell with empty state; Chat placeholder

Requires `SUPABASE_SERVICE_ROLE_KEY` in the environment and the migration
`supabase/migrations/0002_team_members.sql`.

## Phase 1

- Next.js 14 scaffold with Tailwind + shadcn/ui (dark "imperial" theme with
  gold accent)
- Supabase Auth (email + password, no self-signup)
- `profiles` table with `admin` / `client` roles, RLS policies, and an auth
  trigger that creates a profile per new user
- Greek login page, session middleware, role-based routing
  (`/admin` for the admin, `/dashboard` for clients)
- Admin overview with client count + clients list

## Local setup

1. Copy the env file and fill in your Supabase project keys
   (Supabase Dashboard → Project Settings → API):

   ```bash
   cp .env.example .env.local
   ```

2. Run the migration in the Supabase SQL Editor:
   `supabase/migrations/0001_profiles.sql`

3. Disable public signups (credentials are issued manually):
   Supabase Dashboard → Authentication → Sign In / Up → disable
   **Allow new users to sign up**.

4. Create your own admin account: Authentication → Users → **Add user** →
   set email + password and check **Auto confirm user**. Then in the SQL
   Editor promote it:

   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```

5. Create client accounts the same way (Add user, auto-confirm). Optionally
   set user metadata when creating them so the profile is pre-filled:

   ```json
   { "full_name": "Όνομα Πελάτη", "company_name": "Κλινική ΧΥΖ", "phone": "+30 ..." }
   ```

6. Start the dev server:

   ```bash
   npm install
   npm run dev
   ```

## Deployment (Vercel)

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the
Vercel project's environment variables and deploy. Later phases add Stripe and
Resend keys (see `.env.example`).
