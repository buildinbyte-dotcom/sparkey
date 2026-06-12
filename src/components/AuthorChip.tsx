import Link from "next/link";
import { tradeRoleLabel } from "@/lib/constants";
import type { Profile } from "@/lib/types";

/**
 * Semi-pseudonymous author display: the community sees
 * "Verified NSW Electrician, 8 yrs" style context, never private details.
 */
export function AuthorChip({ author }: { author: Profile }) {
  return (
    <Link
      href={`/u/${author.handle}`}
      className="inline-flex flex-wrap items-center gap-1.5 text-xs text-ink-400 hover:text-ink-200"
    >
      <span className="font-medium text-ink-200">{author.display_name}</span>
      {author.verification_status === "verified" && (
        <span className="text-emerald-400">✓</span>
      )}
      <span>
        · {author.state} {tradeRoleLabel(author.trade_role)}
        {author.years_experience > 0 && `, ${author.years_experience} yrs`}
      </span>
      <span className="text-spark-400">· {author.reputation} rep</span>
    </Link>
  );
}
