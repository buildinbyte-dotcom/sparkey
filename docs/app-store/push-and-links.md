# Push notifications and universal links: production setup

The code is done and tested locally (see AGENTS.md). These are the one-time steps that need
your Apple Developer account, Supabase project and Vercel project. Do them in order.

What you'll end up with:
- **Push notifications:** members who turn them on get an alert on their phone for every in-app
  notification except helpful votes, and tapping it opens the right page.
- **Universal links:** tapping a `sparkyq.com` link (including the sign-in link in emails) on an
  iPhone with the app installed opens the app instead of Safari.

You need: your Supabase project ref (the `abcd1234` in `https://abcd1234.supabase.co`), the
Supabase CLI linked to it (see [UPDATING.md](../UPDATING.md#applying-to-production)), and
migration `0005_push_notifications.sql` applied to production.

---

## 1. Find your Team ID

developer.apple.com → **Account → Membership details → Team ID** (10 characters, e.g.
`AB12CD34EF`). It's not secret.

## 2. Let Xcode set up signing

1. `npx cap open ios`
2. Select the **App** target → **Signing & Capabilities**.
3. Tick **Automatically manage signing** and pick your **Team**.
4. Check both capabilities are listed (they come from `App/App.entitlements`):
   **Push Notifications** and **Associated Domains** (`applinks:sparkyq.com`).
   If Xcode shows a red error for either, click it and choose **Try Again**; it registers the
   bundle id `au.com.sparkyq.app` with those capabilities in your Apple account.

## 3. Create the APNs key

1. developer.apple.com → **Certificates, Identifiers & Profiles → Keys → +**
2. Name it `SparkyQ Push`, tick **Apple Push Notifications service (APNs)**, Continue, Register.
3. **Download** the `AuthKey_XXXXXXXXXX.p8` file. Apple only lets you download it **once**;
   store it in a password manager. Note the **Key ID** shown on the page.
4. Never commit the file or paste it into chat or an issue.

One key works for all your apps and for both sandbox and production.

## 4. Deploy the push function and its secrets

From the repo root, with the CLI linked to production:

```bash
supabase functions deploy push
```

Generate a random shared secret and keep it handy for this step and step 5:

```bash
openssl rand -hex 32
```

```bash
supabase secrets set PUSH_WEBHOOK_SECRET=<the random secret> APNS_KEY_ID=<Key ID> APNS_TEAM_ID=<Team ID> APNS_BUNDLE_ID=au.com.sparkyq.app APNS_ENV=production
```

```bash
supabase secrets set APNS_PRIVATE_KEY="$(cat ~/path/to/AuthKey_XXXXXXXXXX.p8)"
```

`APNS_ENV=production` is right for TestFlight and App Store builds. Builds you run straight from
Xcode onto your own phone use Apple's sandbox; to test those, temporarily set
`APNS_ENV=development` and set it back afterwards.

## 5. Point the database at the function

Supabase → **SQL Editor**, with your project ref and the same random secret as step 4:

```sql
select vault.create_secret('https://<project-ref>.supabase.co/functions/v1/push', 'push_function_url');
select vault.create_secret('<the random secret>', 'push_webhook_secret');
```

Until these two exist, nothing is pushed (in-app notifications keep working).
To change one later: `select vault.update_secret((select id from vault.secrets where name = 'push_webhook_secret'), '<new value>');`

## 6. Universal links

1. Vercel → Project → Settings → Environment Variables → add `APPLE_TEAM_ID` = your Team ID
   (Production) → redeploy.
2. Check `https://sparkyq.com/.well-known/apple-app-site-association` shows JSON containing
   `<Team ID>.au.com.sparkyq.app`. (It's a 404 until the variable is set.)
3. Supabase → **Authentication → URL Configuration**: **Site URL** = `https://sparkyq.com`, and
   **Redirect URLs** include `https://sparkyq.com/auth/callback`.
4. Supabase → **Authentication → Email Templates**: set Magic Link and Confirm signup to the
   template in [DEPLOYMENT.md §1.4](../../DEPLOYMENT.md#14-configure-authentication-magic-link--6-digit-code-emails).
   The old `{{ .ConfirmationURL }}` link goes through Supabase's domain, which never opens the app.

Apple caches the association file; after first install it can take a while to apply.

## 7. Test on a real iPhone (TestFlight build)

The Simulator can't test real delivery or universal links from email.

- [ ] Sign in, tap **Turn on** in the banner, allow notifications.
- [ ] Supabase → Table Editor → `push_tokens` has a row for your account.
- [ ] From another account (or the reviewer account), answer one of your questions. Within a few
      seconds a notification arrives; tapping it opens that question.
- [ ] Sign out: your row disappears from `push_tokens`.
- [ ] Request a sign-in email on the phone and tap the link in Mail: it opens the app and signs
      you in (the 6-digit code also still works).

## Troubleshooting

| Symptom | Check |
| --- | --- |
| No row in `push_tokens` | Notifications allowed in iOS Settings → SparkyQ? Build signed with your team and the Push capability (step 2)? |
| Row exists, no notification | Supabase → Edge Functions → push → Logs. `APNs not configured, dry run` means step 4 secrets are missing. No log at all means the vault secrets (step 5) are missing or wrong. |
| Logs show `InvalidProviderToken` | Key ID, Team ID or `.p8` contents don't match (step 3/4). |
| Logs show `BadDeviceToken` | `APNS_ENV` doesn't match the build: TestFlight/App Store need `production`, Xcode-run builds need `development`. |
| `TooManyProviderTokenUpdates` | Harmless if rare; the function reuses its token for 50 minutes per instance. |
| Links open Safari, not the app | Step 6: association file reachable, Team ID right, app reinstalled after the file went live, email template updated. Long-press a link → "Open in SparkyQ" re-enables it if a user chose Safari once. |
