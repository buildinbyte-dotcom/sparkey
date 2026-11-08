import Link from "next/link";
import { InfoPage, SupportEmailLink } from "@/components/InfoPage";

export const metadata = { title: "Support" };

export default function SupportPage() {
  return (
    <InfoPage title="Support">
      <p>
        Need help with SparkyQ? Email <SupportEmailLink /> and we&apos;ll get back to you, usually
        within two business days.
      </p>

      <section>
        <h2>Signing in</h2>
        <p>
          Enter your email on the sign-in screen and we&apos;ll send a 6-digit code. Codes expire
          after an hour; request a new one if it doesn&apos;t arrive, and check your junk folder.
        </p>
      </section>

      <section>
        <h2>Getting verified</h2>
        <p>
          Add your licence details in <Link href="/settings">Settings</Link>. A moderator checks
          them against your state&apos;s public licence register, usually within a few business
          days. Verified members can answer questions and vote.
        </p>
      </section>

      <section>
        <h2>Reporting and blocking</h2>
        <ul>
          <li>
            Tap <strong>Flag</strong> on any question, answer or comment that is unsafe, spam or
            breaches privacy. Moderators review every flag.
          </li>
          <li>
            Tap <strong>Block</strong> on a post or a member&apos;s profile to hide everything they
            post. Unblock from their profile or Settings.
          </li>
        </ul>
      </section>

      <section>
        <h2>Deleting your account</h2>
        <p>
          Go to <Link href="/settings">Settings → Delete account</Link>. Deletion is permanent and
          removes your profile, licence details, posts and photos. See the{" "}
          <Link href="/privacy">privacy policy</Link> for details.
        </p>
      </section>

      <section>
        <h2>Safety</h2>
        <p>
          SparkyQ is peer discussion between trade professionals, not formal advice. Electrical
          work must be carried out by appropriately licensed people in line with your state&apos;s
          requirements and AS/NZS 3000.
        </p>
      </section>
    </InfoPage>
  );
}
