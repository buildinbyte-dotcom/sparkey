import Link from "next/link";
import { InfoPage, SupportEmailLink } from "@/components/InfoPage";

export const metadata = { title: "Privacy policy" };

// DRAFT: written from what the app actually stores (supabase/migrations). Have the owner
// review before App Store submission, and update it whenever new data is collected.
export default function PrivacyPage() {
  return (
    <InfoPage title="Privacy policy" updated="8 November 2026">
      <p>
        SparkyQ is a peer-help network for licensed Australian electricians. This policy explains
        what we collect, who can see it, and how to delete it. We handle personal information in
        line with the Australian Privacy Principles.
      </p>

      <section>
        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Account:</strong> your email address, used to sign you in with a one-time code.
          </li>
          <li>
            <strong>Profile:</strong> display name, handle, state, trade role, years of experience,
            and optionally a bio and specialisations.
          </li>
          <li>
            <strong>Private details:</strong> your real name (optional) and your licence state,
            number and class, used only to verify you against public licence registers.
          </li>
          <li>
            <strong>What you post:</strong> questions, answers, comments, photos, outcome notes,
            helpful votes and reports (flags).
          </li>
          <li>
            <strong>Activity we derive:</strong> reputation and safety scores, question view counts
            and in-app notifications.
          </li>
          <li>
            <strong>Notification token (app only):</strong> if you turn on notifications, a token
            from Apple or Google that lets us send alerts to your phone. It&apos;s removed when you
            sign out or delete your account.
          </li>
          <li>
            <strong>On your device only:</strong> your light/dark theme choice and a sign-in session
            cookie.
          </li>
        </ul>
        <p className="mt-2">
          We don&apos;t use advertising, analytics or tracking tools, and we don&apos;t sell or
          share your information for marketing.
        </p>
      </section>

      <section>
        <h2>Who can see it</h2>
        <ul>
          <li>
            Signed-in members can see your display name, handle, state, trade role, experience, bio,
            specialisations, verification status, reputation and what you post.
          </li>
          <li>
            Your real name and licence details are visible only to you and SparkyQ moderators.
          </li>
          <li>
            Photos you attach are stored at unguessable web addresses. Anyone given a photo&apos;s
            link can open it, so crop out faces, number plates and client addresses before
            uploading.
          </li>
          <li>Members you block can&apos;t be told you blocked them.</li>
        </ul>
      </section>

      <section>
        <h2>Service providers</h2>
        <ul>
          <li>Supabase: database, sign-in and photo storage, hosted in Sydney, Australia.</li>
          <li>Vercel: hosts the website and app pages.</li>
          <li>Our email provider: sends your sign-in codes.</li>
          <li>
            Apple Push Notification service: delivers app notifications (the alert text and a
            link to the post) if you turn them on.
          </li>
          <li>
            OpenAI: only if you tap &ldquo;Tidy with AI&rdquo; on the ask page, the draft question
            text is sent to OpenAI to suggest formatting. Nothing is sent otherwise.
          </li>
        </ul>
        <p className="mt-2">
          Some providers may process data outside Australia. They only use it to provide their
          service to us.
        </p>
      </section>

      <section>
        <h2>Keeping and deleting your data</h2>
        <p>
          We keep your information while your account exists. You can delete your account at any
          time in <Link href="/settings">Settings → Delete account</Link>. This permanently removes
          your account, profile, licence details, questions (including answers others posted on
          them), answers, comments, votes and photos. Copies may remain in encrypted backups for a
          short period before they are overwritten. Moderation records (for example, that a report
          was resolved) are kept without your identity.
        </p>
      </section>

      <section>
        <h2>Your choices</h2>
        <ul>
          <li>Edit your profile and private details any time in Settings.</li>
          <li>Block members to hide their content from you.</li>
          <li>Ask us for a copy of your information or to correct it.</li>
        </ul>
      </section>

      <section>
        <h2>Contact and complaints</h2>
        <p>
          Contact <SupportEmailLink /> with any privacy question or complaint. If you&apos;re not
          satisfied with our response, you can contact the Office of the Australian Information
          Commissioner at <a href="https://www.oaic.gov.au">oaic.gov.au</a>.
        </p>
      </section>
    </InfoPage>
  );
}
