# SparkyQ ⚡

**A verified peer-help and reputation network for Australian electricians** — practical
job-site answers build reputation, and reputation unlocks better work.

A closed, verified, mobile-first PWA for NSW & VIC electricians.

## Feature set

- **Public landing page** with waitlist signup (email, state, role, specialisation).
- **Passwordless auth** — email magic links via Supabase Auth.
- **Verified profiles** — display name or trade handle public, real name + licence
  private; state, trade role, years of experience, specialisations.
- **Manual licence verification** — members submit licence details; admins check them
  against state public registers and approve from the moderation dashboard.
- **Semi-pseudonymous posting** — the community sees "Verified NSW Electrician, 8 yrs",
  the platform knows who you are.
- **Question feed** — search (Postgres full-text), filters by state, category and
  urgency; urgency levels include "stuck on site".
- **Ask flow** — title, body, photos (Supabase Storage, phone camera capture), state,
  job type, urgency, risk level, tags. High-risk keyword detection auto-escalates risk
  and queues expert review.
- **Answers & discussion** — answer threads (verified members only), clarifying
  comments, accepted answers, helpful votes, outcome updates ("what fixed it").
- **Safety layer** — peer-to-peer disclaimer on every thread, high-risk warning
  banners, one-tap safety flags, expert review verdicts (safe / disputed / unsafe),
  moderation queue with severity-based penalties.
- **Reputation engine** — immutable `reputation_events` ledger: +10 accepted answer,
  +5 helpful vote, +20 expert confirmation, +5 standards reference, +5/+3 outcome
  confirmation, −25 to −100 for removed unsafe answers. Category-specific scores and
  a separate safety score, all maintained by database triggers.
- **AI question formatter (optional)** — "Tidy with AI" on the ask page cleans up rough
  drafts, suggests tags, job type and risk level, and lists missing info. Guardrailed to
  formatting only: it never writes or alters technical content, and the feature is hidden
  unless `OPENAI_API_KEY` is configured (uses `gpt-4.1-mini` by default).
- **Notifications** — in-app alerts for answers, accepted answers, helpful votes,
  verification results and moderation actions.
- **Admin dashboard** — member stats, licence verification queue, flag queue with
  one-click uphold/dismiss (uphold removes content and applies penalties atomically).
- **PWA** — installable, mobile-first dark UI.

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | Next.js 15 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Hosting | Vercel |
| Database / Auth / Storage | Supabase (Postgres + RLS, magic-link auth, media bucket) — Sydney region |
| Search | Postgres full-text search (tsvector) |

## Getting started

**👉 New to Supabase/Vercel? Follow the full step-by-step guide in [DEPLOYMENT.md](DEPLOYMENT.md).**

Quick version:

1. Create a Supabase project (Sydney region) and run
   [`supabase/migrations/0001_initial_schema.sql`](supabase/migrations/0001_initial_schema.sql)
   in the SQL Editor.
2. Copy `.env.example` to `.env.local` and fill in your Supabase URL + anon key.
3. `npm install && npm run dev`
4. Import the repo into Vercel, set the same env vars, deploy.

## Local development (no cloud data, no real emails)

Run the whole backend on your machine with the Supabase CLI. Migrations and
[`supabase/seed.sql`](supabase/seed.sql) load automatically, and sign-in emails are caught
by a local inbox instead of being sent.

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and the CLI:
   `brew install supabase/tap/supabase`
2. Start Docker, then `supabase start` (first run downloads ~2–3 GB of images).
3. Create `.env.development.local` (gitignored; overrides `.env.local` for `npm run dev` only).
   These are Supabase's standard local demo keys:
   ```
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
4. `npm run dev`, then sign in at http://localhost:3000/login with a test account.
   Get the 6-digit code with `npm run otp -- <email>`, or open the inbox at http://127.0.0.1:54324.

| Test account | What it is |
| --- | --- |
| `admin@sparkyq.test` | Admin + verified (NSW) — moderation dashboard |
| `nsw.sparky@sparkyq.test` | Verified NSW electrician |
| `vic.sparky@sparkyq.test` | Verified VIC contractor, expert reviewer |
| `pending@sparkyq.test` | Licence awaiting admin approval |
| `new@sparkyq.test` | No profile yet — goes through onboarding |

Useful commands: `supabase db reset` (wipe and re-seed), `supabase stop`, Studio at
http://127.0.0.1:54323. The iOS Simulator app (`npm run cap:ios`) uses the same local setup.

## Project structure

```
supabase/migrations/   Database schema, RLS policies, triggers, moderation RPCs
src/app/               Routes (landing, login, onboarding, feed, ask, questions,
                       profiles, notifications, settings, admin)
src/components/        Shared UI (question cards, badges, safety banner, forms)
src/lib/               Supabase clients, domain constants, types, utils
```

## Safety & compliance notes

- Technical content sits behind authentication — no public/DIY indexing.
- Every thread carries a peer-to-peer disclaimer; high-risk topics get warning banners.
- Only verified (licence-checked) members can answer or vote.
- We store licence **check status**, not document copies (APP 3 data minimisation).
- Uploads prompt users to crop faces, plates and client-identifying details.
- An audit log records every moderation decision.

## License

Proprietary — **All rights reserved**. This source is publicly viewable for
reference only and is **not** open source. No use, copying, modification, or
distribution is permitted without prior written permission. See [LICENSE](LICENSE).
