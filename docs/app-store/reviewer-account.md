# Store reviewer account setup

Apple and Google reviewers must be able to sign in, but SparkyQ members sign in with a code
emailed to them, which reviewers can't receive. So production has one **reviewer account**
that signs in with a password at `/login/review` ("App review sign-in" under the sign-in form).

How it's protected:
- The server only accepts the one email in the `APP_REVIEW_EMAIL` environment variable. Any
  other email is refused, so this page can't be used to get into normal member accounts.
- The email isn't shown anywhere in the app or sent to the browser.
- If `APP_REVIEW_EMAIL` is unset, the page refuses everyone.

Locally this is already set up by the seed: `review@sparkyq.test`, password
`sparkyq-review-local` (see AGENTS.md). Everything below is for **production**.

---

## 1. Create the user in Supabase

1. Pick an email you control, e.g. `appreview@<your domain>`. Don't use a personal address;
   you'll share it with Apple and Google.
2. Generate a strong password (a password manager is fine). You'll paste it into the store
   consoles, so avoid characters that are easy to mistype.
3. Supabase dashboard → **Authentication → Users → Add user → Create new user**:
   - Email: the address from step 1
   - Password: the password from step 2
   - **Auto Confirm User: on** (otherwise it waits for an email confirmation)

## 2. Give it a verified profile

Reviewers need a verified profile to try everything (asking, answering, voting). Supabase →
**SQL Editor** → run, with your email:

```sql
insert into public.profiles (id, handle, display_name, state, trade_role, years_experience,
  bio, verification_status)
select id, 'app_review', 'App Review', 'NSW', 'electrician', 5,
  'Account for App Store / Google Play review.', 'verified'
from auth.users where email = 'appreview@<your domain>';
```

Check it worked (should return one row with `verified`):

```sql
select p.handle, p.verification_status
from public.profiles p join auth.users u on u.id = p.id
where u.email = 'appreview@<your domain>';
```

## 3. Allow it in Vercel

Vercel → Project → **Settings → Environment Variables** → add for **Production**:

| Name | Value |
| --- | --- |
| `APP_REVIEW_EMAIL` | `appreview@<your domain>` |

Then **Deployments → ⋯ → Redeploy** so the server picks it up.

## 4. Test it yourself

Do this on a phone with the TestFlight build (or in a browser on the production site):

1. Open the app → **I already have an account** → **App review sign-in**.
2. Enter the email and password → you land on the feed.
3. Settings shows the account as verified, with Blocked members and Delete account visible.
4. Sign out.

If sign-in fails, see [Troubleshooting](#troubleshooting).

## 5. Give the details to the stores

**Apple:** App Store Connect → your app → the version → **App Review Information**:
- **Sign-in required:** on
- **User name / Password:** the reviewer email and password
- **Notes:** paste the reviewer notes from [README.md](README.md#notes-for-the-reviewer-paste-into-app-review-information--notes)

**Google Play (when Android ships):** Play Console → **App content → App access** →
"All or some functionality is restricted" → add instructions with the same email, password
and steps.

---

## After each review

- **Delete what the reviewer posted.** They may ask test questions or flag real posts, and
  real members can see these. In the SQL editor:
  ```sql
  select id, title, created_at from public.questions
  where author_id = (select id from auth.users where email = 'appreview@<your domain>');
  ```
  Remove anything unwanted from the app (delete the question as the reviewer, or remove it via
  the admin flag queue), and dismiss any test flags in **Admin**.
- **Optionally rotate the password** (Supabase → Authentication → Users → the user → Reset
  password / Update) and update it in App Store Connect before the next submission.
- **Don't delete the account** while a review is pending, and don't let anyone else use it.

To turn reviewer sign-in off between reviews, remove `APP_REVIEW_EMAIL` in Vercel and redeploy.
Remember to add it back before the next submission.

---

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| "These details don't match a review account." | Email doesn't exactly match `APP_REVIEW_EMAIL`, the variable isn't set for Production, the site wasn't redeployed after setting it, or the password is wrong. |
| Signs in, then lands on onboarding | The profile (step 2) is missing. Run the insert. |
| Signs in but can't answer or vote | Profile isn't `verified`. Re-run step 2 or set `verification_status = 'verified'` for that profile. |
| "Email not confirmed" behaviour | The user was created without **Auto Confirm User**. Delete it and create it again with the option on. |
| Works on the website but not in the app | The app build points at the wrong server. See [UPDATING.md §4](../UPDATING.md#4-native-app-changes). |
