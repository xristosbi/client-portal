# CB Automates — Client Portal

Premium client portal for CB Automates (AI automation agency). Clients
log in with credentials issued by the agency and see only their own data; the
admin has full visibility across all clients.

**Stack:** Next.js 14 (App Router, TypeScript) · Supabase (Auth, Postgres, RLS,
Storage) · Stripe · Tailwind CSS + shadcn/ui · Resend · Vercel

All user-facing UI text is in **Greek**.

## Phase 13 (current)

- Password management, no migration needed (Supabase Auth handles it):
  - `/portal/account` ("Ο Λογαριασμός μου", linked at the bottom of the
    client sidebar) and an "Αλλαγή Κωδικού" card on admin Ρυθμίσεις,
    both using the shared `ChangePasswordForm` (min 8 chars, must match,
    `supabase.auth.updateUser`)
  - "Ξέχασα τον κωδικό μου" on /login → `resetPasswordForEmail` with a
    generic confirmation that never reveals whether an account exists
  - `/auth/callback` exchanges the PKCE code for a cookie session, then
    forwards to `/reset-password`, which sets the new password and sends
    the user to `/` (routed by role)
  - `/reset-password` is in the middleware's public paths so a recovery
    link can land before the session cookie exists
- **Supabase dashboard setup required** — see "Password reset emails"
  below

## Password reset emails (Supabase config)

Reset emails are sent by Supabase Auth, not by our Resend integration
(`lib/email.ts` only sends the welcome email). Two things must be set in
the Supabase dashboard:

1. **Authentication → URL Configuration** — Site URL must be the
   production URL, and `https://<domain>/auth/callback` must be in the
   Redirect URLs allowlist, or the link in the email is rejected.
2. **Project Settings → Authentication → SMTP Settings** — the built-in
   sender is rate-limited (a few emails per hour) and explicitly not for
   production. Point it at Resend: host `smtp.resend.com`, port `465`,
   username `resend`, password = a Resend API key, sender address on the
   verified domain.

## Phase 11

- `agreements` table (markdown text OR pdf per row, most recent row per
  client is "the" agreement) + private `agreements` storage bucket with
  the proven folder-prefix RLS pattern
- Admin: Συμφωνία section on `/admin/clients/[id]` — type toggle
  (Markdown κείμενο / Ανέβασμα PDF), create + edit/replace, rendered
  markdown preview, old PDFs cleaned up on replace
- Client: `/portal/agreement` replaces the placeholder — markdown
  rendered with react-markdown + @tailwindcss/typography, or a signed
  1-hour "Προβολή PDF" link; read-only
- Migration: `supabase/migrations/0013_agreements.sql`

## Phase 10

- Unread support badges: `client_last_read_at` / `admin_last_read_at` on
  tickets, a `mark_ticket_read` RPC called when a thread opens, an
  `unread_ticket_count` RPC, and a gold pill on the Υποστήριξη sidebar
  item for both roles (hidden at 0, recomputed per navigation)
- Notifications: `notifications` (nullable client_id = broadcast) +
  `notification_reads` (per-client read state) with RLS;
  `/admin/notifications` to send (to one client or all) and delete;
  `/portal/notifications` replaces the placeholder with a read/unread
  list where clicking marks read; unread count badge on the client's
  Ειδοποιήσεις sidebar item (the "bell" — the desktop shell has no top
  bar, so the sidebar item plays that role)
- Auto-notifications: admin ticket reply → type `support`; admin invoice
  upload → type `payment`; client-file-upload→admin skipped (the model
  is client-scoped, as anticipated in the spec)
- Migration: `supabase/migrations/0012_notifications_unread.sql`

## Phase 9

- Support tickets: `support_tickets` + `ticket_messages` tables with RLS
  (clients see/create only their own; admin manages all); a new message
  bumps the ticket's `updated_at` via a SECURITY DEFINER trigger so
  active conversations sort first
- `/portal/support` replaces the placeholder: ticket list + Νέο Αίτημα
  dialog (subject, message, priority, auto-linked project), thread view
  at `/portal/support/[id]` with reply box, and a Κλείσε Ραντεβού
  section with the official Calendly inline embed (empty state when the
  URL isn't configured)
- `/admin/support` (added to the sidebar): all tickets with status +
  priority filters, sorted by most recently updated; thread view at
  `/admin/support/[id]` with reply box and a status dropdown
- `app_settings.calendly_url` + a Calendly Link field on Ρυθμίσεις
- Migration: `supabase/migrations/0011_support.sql`

## Phase 8

- `project_files` table + private `project-files` storage bucket for
  client <-> admin file exchange per project (images, video, PDF, Word)
- Client uploads go straight from the browser to Supabase Storage via a
  signed XHR request (for real upload progress — supabase-js's storage
  client doesn't expose progress events), then a server action records
  the metadata row after the bytes are confirmed uploaded
- `/portal/files`: drag-and-drop or file-picker upload with a progress
  bar, optional note after upload, and a grid of the client's own files
  plus anything the admin uploaded to them ("Εσείς" / "Imperial
  Automations")
- `/admin/clients/[id]` gains an "Αρχεία" section: same uploader (tagged
  `is_from_admin=true`) plus the full file grid for that client's project
- Size limits: 100MB for video, 20MB for everything else, enforced
  client-side with a Greek error message; the storage bucket itself caps
  at 100MB and restricts mime types as a second layer
- Migration: `supabase/migrations/0008_project_files.sql`

## Phase 7

- Removed the redundant `welcome_message` display on `/portal` (header
  already covers it); the field and admin form are untouched
- `profiles.subscription_billing_day` (1-31, nullable) — settable in the
  client edit dialog alongside the other subscription fields
- `/portal` "Επόμενη Πληρωμή" card now shows a real next-payment date
  (`lib/finance.ts#nextBillingDate`, Athens-local, clamps to the last day
  of short months) when a billing day is set; falls back to the old
  "Ενεργή μηνιαία συνδρομή" text for clients without one
- Migration: `supabase/migrations/0007_subscription_billing_day.sql`

## Phase 6

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
