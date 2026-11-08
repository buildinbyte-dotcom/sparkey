# Agent guide: SparkyQ

Instructions for coding agents working in this repo. Humans: see [README.md](README.md).

SparkyQ is a Next.js 15 (App Router, server actions) + Supabase app for verified Australian
electricians. It ships three ways from one codebase: the website/PWA on Vercel, and an iOS app
(`ios/`, Capacitor 8) that loads the hosted site in a WebView. Android will follow the same way.

## Ground rules

- **Never test against the cloud Supabase project.** `.env.local` points at it and holds real
  data. All testing uses local Supabase (below). Never run `supabase link`, `supabase db push`
  or seed scripts against a remote project.
- **Fix issues you find on the way.** If you notice a bug or broken style while doing something
  else, fix it in the same task and list it in your summary. Ask first only if the fix is risky,
  needs a product decision, or deserves its own branch.
- **Don't run `npm run build` while `npm run dev` is running.** Both write `.next/` and the dev
  server starts returning 500s (`Cannot find module './NNN.js'`). Stop dev, build, then restart dev.
- Verify changes in a real browser or the Simulator before calling them done. Type-checking
  alone is not verification.

## Local test environment

### 1. Start the backend

Docker Desktop must be running (`open -a Docker`; wait until `docker info` succeeds).
Supabase CLI: `brew install supabase/tap/supabase` if `supabase --version` fails.

```bash
supabase start          # first run pulls ~2-3 GB of images; applies migrations + seed
supabase status         # URLs and keys if you need them again
```

| Service | URL |
| --- | --- |
| API | http://127.0.0.1:54321 |
| Studio (DB browser) | http://127.0.0.1:54323 |
| Mailpit (catches all email) | http://127.0.0.1:54324 |
| Postgres | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |

`supabase db reset` wipes the database, re-applies `supabase/migrations/` and re-runs
`supabase/seed.sql`. Do this whenever test data gets messy. There is no `psql` on the host;
use `docker exec supabase_db_sparkey psql -U postgres -c "..."`.

### 2. Point the dev server at it

`.env.development.local` (gitignored) makes `npm run dev` use local Supabase while builds keep
using `.env.local`. If it's missing, create it with Supabase's standard local demo keys
(public, not secrets):

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPPORT_EMAIL=support@sparkyq.test
APP_REVIEW_EMAIL=review@sparkyq.test
```

Start the dev server (in Claude Code, `preview_start` with the `next-dev` config in
`.claude/launch.json`; otherwise `npm run dev`). Confirm the startup log lists
`Environments: .env.development.local, .env.local`. Env changes need a dev server restart.

### 3. Sign in

Auth is passwordless (email code). Seeded accounts, all ending in `@sparkyq.test`:

| Email | Role | Use it to test |
| --- | --- | --- |
| `admin@sparkyq.test` | Admin + verified, NSW | `/admin`: licence queue (1 pending), flag queue (1 open) |
| `nsw.sparky@sparkyq.test` | Verified NSW electrician | Asking, answering, voting, notifications |
| `vic.sparky@sparkyq.test` | Verified VIC contractor, expert | Expert reviews; has 25 reputation |
| `pending@sparkyq.test` | Licence pending | Unverified restrictions; admin approval flow |
| `new@sparkyq.test` | No profile | Onboarding flow |
| `review@sparkyq.test` | Verified App Store reviewer | Password sign-in at `/login/review`, password `sparkyq-review-local` |

Flow:
1. Go to http://localhost:3000/login, enter the email, submit.
2. Get the code: `npm run -s otp -- admin@sparkyq.test` (prints the 6 digits from Mailpit).
3. Enter it in the code field. It is **one** input (`aria-label="6-digit sign-in code"`) under
   six display boxes; typing or setting the full 6 digits submits automatically.

Each request sends a new code, so always fetch the code *after* submitting the email. Don't tap
the magic link in the email; it targets the browser, not the app.

### 4. Seed data

`supabase/seed.sql` creates the users above (verified ones with checked licences) plus 3 questions (one "stuck on site", one resolved
with an accepted answer), answers, helpful votes, a comment and an open flag. It inserts
through the real tables so triggers compute reputation and notifications. When you add a
migration that changes these tables, update the seed and run `supabase db reset` to check it.

## Testing in the iOS Simulator

Requires full Xcode (`xcode-select -p` should print `/Applications/Xcode.app/...`).
The Simulator reaches the Mac's `localhost`, so the app uses the same local dev server and
Supabase. Keep `npm run dev` running.

```bash
npx cap sync ios        # after any change to capacitor.config.ts, plugins or native files
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 17' \
  -derivedDataPath <scratch-dir>/DerivedData build
```

Then install and launch `<scratch-dir>/DerivedData/Build/Products/Debug-iphonesimulator/App.app`
(Claude Code: the iOS Simulator tool's `launch` action; otherwise `xcrun simctl install booted`
then `xcrun simctl launch booted au.com.sparkyq.app`). A human can use `npm run cap:ios` and
press Run in Xcode instead.

Rebuild the native app only for native changes. Web changes (pages, CSS, components) are served
live by the dev server; just relaunch the app or navigate.

Simulator gotchas:
- **Screenshots lag.** After a tap or typing, wait 2-5 s before screenshotting; the first load
  of a page in dev can take ~8 s to compile. Don't conclude input was dropped from one screenshot.
- **Hot reload sometimes doesn't reach the WebView.** If the app shows old UI after a change,
  relaunch it.
- The first keyboard use shows an iOS tip sheet ("slide to type"); tap Continue.
- The round "N" button bottom-left is the Next.js dev indicator; it isn't in production.
- If no Simulator is booted: `xcrun simctl boot "iPhone 17"`.

## How the app differs from the website

- The shell appends `SparkyQApp` to the user agent (`NATIVE_APP_UA_MARKER` in
  `src/lib/constants.ts`). `src/app/page.tsx` redirects those requests from `/` to `/welcome`
  (signed out) or `/feed`. To test that path with curl:
  `curl -A "Mozilla/5.0 SparkyQApp" -i http://localhost:3000/`
- PWA install prompts and the service worker are disabled in the app
  (`Capacitor.isNativePlatform()` in `src/components/PwaManager.tsx`).
- The page runs edge to edge: the body is padded by `env(safe-area-inset-top)`, and full-height
  wrappers use the `min-h-app` utility, never `min-h-dvh`. Both are 0/no-ops in browsers.
- Form fields are 16px on touch devices so iOS doesn't zoom on focus. Don't add a rule that
  shrinks inputs below 16px on mobile.

## Data access rules

- `profiles.real_name` is column-protected (migration 0004). Never `select("*")` from
  `profiles`; use `PUBLIC_PROFILE_COLUMNS`. Real names come only from the
  `get_real_names(p_ids)` function, which answers for yourself or for admins.
- Content queries must hide blocked members' posts from the viewer: use `getBlockedIds()` from
  `src/lib/blocks.ts` (feed, question page and profile already do).
- Account deletion goes through `delete_my_account()`; anything that references `profiles`
  must cascade or `set null`, or deletion breaks. Test new triggers against it:
  `begin; select set_config('request.jwt.claims','{"sub":"<id>","role":"authenticated"}',true);
  set local role authenticated; select delete_my_account(); rollback;`

App Store requirements (account deletion, blocking, reporting, reviewer sign-in, privacy
labels) are documented in [docs/app-store/README.md](docs/app-store/README.md), and the
production reviewer account in [docs/app-store/reviewer-account.md](docs/app-store/reviewer-account.md).
How changes reach production (migration order, env vars, new App Store builds) is in
[docs/UPDATING.md](docs/UPDATING.md); new migrations must be added to its production check
query. Keep the
privacy policy (`src/app/privacy/page.tsx`) in sync when collecting new data.

## Styling conventions

Tailwind v4, configured in `src/app/globals.css`. Shared classes (`.field`, `.btn-primary`,
`.btn-secondary`, `.btn-danger`, `.card`) live in `@layer components` so utilities placed next
to them override them (`field pl-9`, `btn-primary text-xs`). Keep new shared classes inside a
layer: unlayered CSS beats every utility and silently breaks overrides.

## Before finishing

- `npx tsc --noEmit`
- Stop dev, `npm run build`, restart dev (see ground rules).
- Check the change in light and dark mode, and on a phone width or the Simulator if it's UI.
- Don't commit `.env*.local`.
