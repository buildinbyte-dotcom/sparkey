# Shipping updates

How a change gets from this repo to users. SparkyQ ships from one codebase three ways:

| Channel | What users run | How it updates |
| --- | --- | --- |
| Website / PWA | The Next.js site on Vercel | Automatically on every merge to `main` |
| iOS app (App Store) | A native shell that loads the **production website** | Website changes appear instantly; the shell itself only changes with a new App Store build |
| Android app (later) | Same as iOS | Same as iOS |

So most changes (pages, styles, features, fixes) are **website changes** and reach the store
apps without any App Store review. Only native changes need a new store build.

First-time setup is in [DEPLOYMENT.md](../DEPLOYMENT.md). Local testing is in
[AGENTS.md](../AGENTS.md) and the README.

---

## Which kind of change is this?

| You changed… | Do this |
| --- | --- |
| Anything in `src/` (pages, components, CSS, server actions) | [Website change](#1-website-changes) |
| A file in `supabase/migrations/` | [Database change](#2-database-changes) **before** merging the code that needs it |
| Anything in `supabase/functions/` (the push sender) | `supabase functions deploy push` after merging |
| An environment variable | [Environment variables](#3-environment-variables) |
| `capacitor.config.ts`, a Capacitor plugin, anything in `ios/`, the app icon or splash | [Native app change](#4-native-app-changes) |
| What data the app collects or who can see it | Also [update the privacy docs](#5-privacy-and-app-store-details) |

---

## 1. Website changes

1. Work on a branch, test locally (see AGENTS.md: browser **and** iOS Simulator for UI).
2. Before merging:
   ```bash
   npx tsc --noEmit
   ```
   ```bash
   npm run build
   ```
   (Stop `npm run dev` first; both use `.next/`.)
3. Open a pull request. Vercel builds a **preview URL** for it; check the change there.
4. Merge to `main`. Vercel deploys production in ~2 minutes. The iOS app shows it the next time
   a page loads.

**Keep the app working with older shells.** Store users can run an old app version for months.
Never make the website depend on a native feature a released build doesn't have. Check with
`Capacitor.isPluginAvailable("PluginName")` before using a new plugin.

**Rollback:** Vercel → Deployments → pick the previous good deployment → ⋯ → **Promote to
Production**. Takes seconds and fixes the store apps too.

---

## 2. Database changes

Schema changes live in numbered files in `supabase/migrations/` (`0001_…`, `0002_…`). Production
must have every file applied **in order**, exactly once.

### Writing a migration

1. Add the next number: `supabase/migrations/0005_short_description.sql`. Never edit a file that
   has already been applied to production; write a new one instead.
2. Test it locally from scratch:
   ```bash
   supabase db reset
   ```
   This re-applies every migration and the seed, so it also proves a brand-new project works.
3. If it touches tables that reference `profiles`, also run the account-deletion check from
   AGENTS.md (deletion must still succeed).
4. Update `supabase/seed.sql` if the change affects test data.

### Applying to production

Apply migrations **before** merging code that depends on them (old code keeps working on a new
schema; new code fails on an old one).

**Option A: Supabase CLI (recommended, tracks what's applied)**

One-time link (needs your database password from Supabase → Project Settings → Database):
```bash
supabase link --project-ref <your-project-ref>
```
The first migrations were run by hand in the SQL editor, so the CLI doesn't know about them yet.
Mark the ones that are already live (check with the queries below first):
```bash
supabase migration repair --status applied 0001 0002
```
Then for every update:
```bash
supabase migration list --linked
```
```bash
supabase db push --dry-run
```
```bash
supabase db push
```
`list` shows local vs production; `--dry-run` shows exactly what would run.

**Option B: SQL editor (by hand)**

Supabase → SQL Editor → New query → paste the **whole** file → Run. One file at a time, in
order. Keep a note of the last number applied.

### Checking what production has

Run in the SQL editor. Each line should say `true` once that migration is applied:
```sql
select
  exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'profiles') as m0001,
  exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'user_blocks') as m0003,
  exists (select 1 from pg_proc where proname = 'get_real_names') as m0004,
  exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'push_tokens') as m0005;
```
`0002` can't be detected: the current `0001` already contains everything it changes. If `m0003`
is `false` and you're unsure about `0002`, run `0002` and then `0003`; re-running `0002` is
harmless at that point. **Never run `0002` once `0003` is applied**: it replaces the
`on_vote_delete` trigger with an older version and breaks account deletion. `0003` and later
are not safe to run twice; check first.

Add a line here whenever you add a migration.

**Never** run `supabase/seed.sql` against production; it creates test accounts with known
passwords.

---

## 3. Environment variables

Set in Vercel → Project → Settings → Environment Variables (Production, and Preview if needed),
then **redeploy** (Deployments → ⋯ → Redeploy). Variables starting with `NEXT_PUBLIC_` are baked
into the build, so a redeploy is always required for them to change.

| Variable | Needed for |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Everything |
| `NEXT_PUBLIC_SITE_URL` | Sign-in email links |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Contact address on `/privacy` and `/support` (required for the stores) |
| `APP_REVIEW_EMAIL` | Store reviewer sign-in ([setup](app-store/reviewer-account.md)) |
| `APPLE_TEAM_ID` | Universal links file at `/.well-known/apple-app-site-association` ([setup](app-store/push-and-links.md)) |

Push notification secrets (APNs key etc.) live in **Supabase**, not Vercel: see
[push-and-links.md](app-store/push-and-links.md).
| `OPENAI_API_KEY`, `OPENAI_MODEL` | Optional "Tidy with AI" |

When you add a variable, add it to `.env.example` too.

---

## 4. Native app changes

Only needed when the shell itself changes: `capacitor.config.ts`, a plugin added or upgraded,
files in `ios/` (permissions in `Info.plist`, capabilities), the icon or splash. Requires a Mac
with Xcode and the Apple Developer account.

1. Test in the Simulator against local services (AGENTS.md).
2. Bump the version in Xcode → App target → General:
   - **Version** (`MARKETING_VERSION`), e.g. `1.0` → `1.1`, shown to users.
   - **Build** (`CURRENT_PROJECT_VERSION`), +1 for every upload, even for the same version.
3. Point the shell at production and sync. **Don't skip this**: without it the build loads
   `http://localhost:3000` and shows the offline screen for everyone.
   ```bash
   npm run cap:sync:prod
   ```
   ```bash
   grep '"url"' ios/App/App/capacitor.config.json
   ```
   The second command must print `https://sparkyq.com`.
4. Open Xcode (`npx cap open ios`), choose **Any iOS Device (arm64)**, then
   **Product → Archive → Distribute App → App Store Connect → Upload**.
5. In App Store Connect the build appears under **TestFlight** after processing (~15 min).
   Install it via TestFlight on a real phone and check sign-in, posting and photos.
6. App Store Connect → your app → **+ Version**, add release notes, select the build, submit.
   Review usually takes 1–3 days.
7. After switching back to local work, run `npx cap sync ios` (no `CAP_SERVER_URL`) so the
   Simulator uses localhost again.

App icon or splash change: replace `assets/icon-only.png` / `assets/splash*.png`, then
```bash
npx capacitor-assets generate --ios --iconBackgroundColor '#0f172a' --splashBackgroundColor '#0f172a' --splashBackgroundColorDark '#0f172a'
```

---

## 5. Privacy and App Store details

If a change collects new data, shows existing data to more people, or adds a service that
receives user data (analytics, crash reporting, push notifications, a new AI feature):

1. Update the privacy policy: `src/app/privacy/page.tsx` (and its "Last updated" date).
2. Update the App Privacy table in [app-store/README.md](app-store/README.md), then the matching
   answers in App Store Connect → App Privacy (no new build needed; it's a form).
3. New sensitive permission (location, microphone, contacts…): add its usage text to
   `ios/App/App/Info.plist`. That's a native change, see section 4.

---

## Release checklist

- [ ] Typecheck and production build pass
- [ ] Tested locally in the browser, and in the iOS Simulator if UI changed
- [ ] New migrations applied to production **before** merging
- [ ] New env vars set in Vercel and redeployed
- [ ] Privacy policy / App Privacy updated if data handling changed
- [ ] Native change? New build uploaded with production `CAP_SERVER_URL` and a higher build number
- [ ] After deploy: open the production site and the store app, sign in, load the feed
