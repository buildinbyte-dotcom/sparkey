# Deploying SparkyQ — step-by-step guide for beginners

This guide assumes you have **never used Supabase or Vercel before**. Follow it top to
bottom and you'll have the app live on the internet in about 30–45 minutes.

You will need:

- A GitHub account (you already have one — this repo lives there).
- A free [Supabase](https://supabase.com) account (the database + login system).
- A free [Vercel](https://vercel.com) account (hosts the website).

No credit card is required for either on the free tiers.

---

## Part 1 — Set up Supabase (database, auth, file storage)

### 1.1 Create the project

1. Go to <https://supabase.com> and click **Start your project**. Sign in with GitHub.
2. Click **New project**.
3. Fill in:
   - **Name:** `sparkeystack` (anything is fine)
   - **Database password:** click *Generate a password* and **save it somewhere safe**
     (you rarely need it, but don't lose it).
   - **Region:** choose **Oceania (Sydney)** — `ap-southeast-2`. This keeps the app fast
     for Australian users.
4. Click **Create new project** and wait ~2 minutes while it provisions.

### 1.2 Run the database migrations

These create every table, security rule, and trigger the app needs. There are several files
in [`supabase/migrations/`](supabase/migrations/) and **all of them must run, in number order**
(`0001_…`, then `0002_…`, and so on).

1. In the Supabase dashboard, open your project and click **SQL Editor** in the left sidebar.
2. Click **New query**.
3. On GitHub, open [`supabase/migrations/0001_initial_schema.sql`](supabase/migrations/0001_initial_schema.sql),
   copy its **entire contents**, and paste it into the SQL editor.
4. Click **Run** (bottom right). You should see "Success. No rows returned".
5. Repeat steps 2–4 for each following file in order (`0002_…`, `0003_…`, …), one per query.

That's it — the whole schema (profiles, questions, answers, votes, flags, reputation
ledger, notifications, blocking, account deletion, storage bucket, seed tags) is now live.

> If you see an error like "type already exists" or "relation already exists", that file
> already ran. For a fresh project, the simplest fix is to create a new Supabase project and
> run each file once. **Don't** run `supabase/seed.sql` here: it creates local test accounts.
>
> Already deployed and adding a new migration later? See [docs/UPDATING.md](docs/UPDATING.md).

### 1.3 Get your API keys

1. In the left sidebar, click the **gear icon (Project Settings) → API Keys**.
2. You need two values — keep this tab open, you'll paste them into Vercel later:
   - **Project URL** — under *Project Settings → Data API*, looks like `https://abcdefgh.supabase.co`
   - **Publishable key** — starts with `sb_publishable_…` (newer projects). On older
     projects this is called the **anon / public key** and starts with `eyJ…`. Either
     works — it's the same thing.

> The publishable/anon key is safe to expose in the browser — all data access is
> protected by Row Level Security rules in the database, not by hiding the key.
> Never share the **Secret key** (`sb_secret_…`, formerly `service_role`) — the app
> doesn't need it.

### 1.4 Configure authentication (magic-link + 6-digit code emails)

1. In the sidebar go to **Authentication → URL Configuration**.
2. Set **Site URL** to your future Vercel URL. You don't know it yet, so use
   `http://localhost:3000` for now and **come back after Part 2, step 2.4** to change it
   to e.g. `https://sparkeystack.vercel.app`.
3. Under **Redirect URLs**, add:
   - `http://localhost:3000/auth/callback`
   - `https://YOUR-APP.vercel.app/auth/callback` (add this after you deploy)
4. **(For installed phone apps)** To include the **6-digit sign-in code** alongside the magic link in emails, go to **Authentication → Email Templates** in Supabase and update both **Magic Link** and **Confirm signup** templates to include `{{ .Token }}`:
   ```html
   <h2>Sign in to SparkyQ</h2>
   <p>Enter this 6-digit code in the SparkyQ app:</p>
   <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px; font-family: monospace;">{{ .Token }}</p>
   <p>Or tap the link below to sign in directly in your browser:</p>
   <p><a href="{{ .ConfirmationURL }}">Sign in to SparkyQ</a></p>
   ```

Supabase's built-in email service works out of the box for a closed beta (it has a low
rate limit of a few emails per hour). When you onboard real users, plug in a free
[Resend](https://resend.com) account under **Authentication → Emails → SMTP Settings**.

---

## Part 2 — Deploy to Vercel

### 2.1 Import the repository

1. Go to <https://vercel.com> and sign up **with your GitHub account**.
2. Click **Add New… → Project**.
3. Vercel shows your GitHub repos. Find **sparkey** and click **Import**.
   (If you don't see it, click *Adjust GitHub App Permissions* and grant access to the repo.)

### 2.2 Configure the build

Vercel auto-detects Next.js — leave **Framework Preset**, **Build Command** and
**Output Directory** at their defaults. You don't need to change anything here.

### 2.3 Add environment variables

Still on the import screen, expand **Environment Variables** and add these
(values come from Part 1.3):

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | your Project URL, e.g. `https://abcdefgh.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your **Publishable key** (`sb_publishable_…`) — or the anon key (`eyJ…`) on older projects |
| `NEXT_PUBLIC_SITE_URL` | leave as `https://sparkey.vercel.app` for now; fix after first deploy |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | the contact address shown on `/privacy` and `/support` (required before App Store submission) |
| `APP_REVIEW_EMAIL` *(when submitting to the stores)* | the store reviewer account — see [docs/app-store/reviewer-account.md](docs/app-store/reviewer-account.md) |
| `OPENAI_API_KEY` *(optional)* | enables the "Tidy with AI" question formatter — see below |

**Optional — AI question formatter.** If you add an `OPENAI_API_KEY`
(create one at <https://platform.openai.com/api-keys>; requires a small prepaid
balance, ~US$5 lasts a long time), the ask page shows a "Tidy with AI" button that
cleans up rough drafts, suggests tags/category/risk and lists missing info. It uses
`gpt-4.1-mini` by default (override with `OPENAI_MODEL`). The AI is strictly limited
to formatting — it never writes or alters technical advice. If the key is not set,
the button simply doesn't appear and everything else works normally.

### 2.4 Deploy

1. Click **Deploy** and wait ~2 minutes.
2. Vercel gives you a live URL like `https://sparkey-abc123.vercel.app`. Open it — you
   should see the SparkyQ landing page. 🎉
3. Now finish the loose ends:
   - In **Vercel → Settings → Environment Variables**, update `NEXT_PUBLIC_SITE_URL`
     to your real URL, then **redeploy** (Deployments → ⋯ → Redeploy).
   - In **Supabase → Authentication → URL Configuration**, set **Site URL** to your
     real URL and add `https://YOUR-REAL-URL/auth/callback` to Redirect URLs.

From now on, **every `git push` to the connected branch automatically redeploys**
the site. Pull requests get their own preview URLs.

---

## Part 3 — First-run setup (make yourself admin)

1. Open your live site, click **Sign in**, enter your email, and click the magic link
   that arrives in your inbox.
2. Complete the onboarding form (you can put any licence number for yourself).
3. Make yourself an admin so you can verify other members. In **Supabase → SQL Editor**, run
   (the first line lets this one-off admin change past the database's privilege guard):

   ```sql
   select set_config('sparkyq.internal', 'true', false);
   update public.profiles
   set is_admin = true, is_expert = true,
       verification_status = 'verified', is_founding_member = true
   where id = (select id from auth.users where email = 'YOUR-EMAIL-HERE');
   ```

4. Refresh the site — an **Admin** item appears in the nav. From there you can:
   - Approve/reject licence verifications (check them against the state public registers:
     [NSW](https://verify.licence.nsw.gov.au/home/Trades) ·
     [VIC](https://www.energysafe.vic.gov.au/licensing/search-public-register)).
   - Resolve safety/spam flags (upholding an "unsafe" flag removes the answer and
     applies the reputation penalty automatically).

---

## Part 4 — Running locally (optional, for development)

Develop against a **local** Supabase (Docker), not the live project, so testing never touches
real members' data or sends real emails. Setup and test accounts are in the README's
[Local development](README.md#local-development-no-cloud-data-no-real-emails) section.

## Part 5 — Shipping updates and the store apps

Website changes, database migrations, environment variables and new App Store builds are
covered in [docs/UPDATING.md](docs/UPDATING.md). App Store submission (privacy labels,
reviewer account) is in [docs/app-store/](docs/app-store/README.md).

---

## Costs and limits

| Service | Free tier | When to upgrade |
| --- | --- | --- |
| Supabase Free | 500MB database, 1GB storage, 50k monthly active users, **pauses after 1 week of inactivity** | Upgrade to Pro (US$25/mo) for production so the project never pauses and you get daily backups |
| Vercel Hobby | Generous free tier, non-commercial use | Upgrade to Pro (US$20/mo) for commercial use — Hobby's licence doesn't cover commercial products |

## Troubleshooting

- **Magic-link email never arrives** — check spam; Supabase free email is limited to
  ~2–4 emails/hour. Configure SMTP (Resend) for real usage.
- **"Invalid Refresh Token" / login loops** — your Site URL or Redirect URLs in
  Supabase don't match the deployed URL. Fix Part 1.4.
- **Photos don't upload** — confirm the migration ran fully (it creates the
  `question-media` storage bucket at the end). Check **Storage** in the Supabase dashboard.
- **Build fails on Vercel** — almost always a missing environment variable. Check the
  Supabase URL and key are set for *Production* and redeploy.
- **"cannot modify privileged profile fields"** in the SQL editor — run
  `select set_config('sparkyq.internal', 'true', false);` before the update (see Part 3).
