# Imperial Automations — Client Portal

Premium client portal for Imperial Automations (AI automation agency). Clients
log in with credentials issued by the agency and see only their own data; the
admin has full visibility across all clients.

**Stack:** Next.js 14 (App Router, TypeScript) · Supabase (Auth, Postgres, RLS,
Storage) · Stripe · Tailwind CSS + shadcn/ui · Resend · Vercel

All user-facing UI text is in **Greek**.

## Phase 2 (current)

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
