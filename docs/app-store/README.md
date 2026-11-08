# App Store submission notes

Reference for filling in App Store Connect (and later Google Play's Data safety form).
For shipping later updates, see [UPDATING.md](../UPDATING.md).
Keep it in sync with [the privacy policy](../../src/app/privacy/page.tsx) and the database.

## Before submitting

- [ ] Set `NEXT_PUBLIC_SUPPORT_EMAIL` in Vercel and redeploy (`/privacy` and `/support` are
      static pages, so the address is baked in at build time).
- [ ] Owner has reviewed the privacy policy wording.
- [ ] Production has migrations `0003_account_deletion_and_blocking.sql` and
      `0004_private_real_name.sql` applied.
- [ ] Reviewer account set up and tested ([reviewer-account.md](reviewer-account.md)).
- [ ] Privacy policy URL: `https://<production domain>/privacy`
- [ ] Support URL: `https://<production domain>/support`

## Reviewer account

Reviewers can't receive emailed sign-in codes, so production has a password-only reviewer
account. Full setup, testing and cleanup: **[reviewer-account.md](reviewer-account.md)**.

## Notes for the reviewer (paste into App Review Information → Notes)

> SparkyQ is a closed community for licensed Australian electricians. Members normally sign in
> with a one-time code sent by email. For review, tap "I already have an account", then
> "App review sign-in" below the form, and use the credentials provided. This account is
> pre-verified so you can ask questions, answer, vote, flag and block.
>
> - Report content: "Flag" on any question, answer or comment. Moderators review every flag.
> - Block a member: "Block" on a question or answer, or on a member's profile.
>   Blocked members can be managed in Settings → Blocked members.
> - Delete account: Settings → Delete account (type DELETE to confirm).

## App Privacy ("nutrition label")

Tracking: **No.** The app does not track users across other companies' apps or websites.

All data below is **linked to the user's identity**, **not used for tracking**, and collected
only for **App Functionality**.

| Apple category | Data type | What it is in SparkyQ |
| --- | --- | --- |
| Contact Info | Email Address | Sign-in |
| Contact Info | Name | Optional private real name; public display name |
| User Content | Photos or Videos | Photos attached to questions |
| User Content | Other User Content | Questions, answers, comments, outcome notes, flags |
| Identifiers | User ID | Account id and public handle |
| Other Data | Other Data Types | Licence state/number/class, trade role, experience, state |
| Usage Data | Product Interaction | Question view counts, helpful votes (reputation) |

Not collected: location, contacts, health, financial info, browsing history, search history,
purchases, diagnostics, advertising data, device identifiers.

If push notifications are added, add **Identifiers → Device ID** (push token, App Functionality).
If crash reporting or analytics is added, update this table and the privacy policy first.

## Google Play Data safety (when Android ships)

Same data as above. Data is encrypted in transit; users can request deletion in-app
(Settings → Delete account) and the deletion URL for the Play listing is
`https://<production domain>/support`.
