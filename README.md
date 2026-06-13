# SparkyQ ⚡

**A verified peer-help and reputation network for Australian electricians** — practical
job-site answers build reputation, and reputation unlocks better work.

This is the Phase 1 "community MVP" described in the TradeGrid Electrical proposal:
a closed, verified, mobile-first PWA for NSW & VIC electricians.

## Feature set (Phase 1)

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
