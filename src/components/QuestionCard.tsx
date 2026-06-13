import Link from "next/link";
import { MessageSquare, Eye, CheckCircle2 } from "lucide-react";
import { Badge, FilterBadge, RiskBadge, UrgencyBadge } from "@/components/Badge";
import { AuthorChip } from "@/components/AuthorChip";
import { jobTypeLabel } from "@/lib/constants";
import { feedFilterHref, timeAgo, type FeedParams } from "@/lib/utils";
import type { Question } from "@/lib/types";

export function QuestionCard({
  question,
  params,
}: {
  question: Question;
  // When provided, the feed badges become clickable filters that toggle on the
  // feed at /feed. Omit (e.g. on profile pages) to render plain badges.
  params?: FeedParams;
}) {
  const active = params?.f;
  const href = (token: string) => feedFilterHref(params ?? {}, token);

  return (
    <article className="card transition hover:border-ink-600">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {params ? (
          <FilterBadge
            href={href(`state:${question.state}`)}
            active={active === `state:${question.state}`}
            variant="blue"
          >
            {question.state}
          </FilterBadge>
        ) : (
          <Badge variant="blue">{question.state}</Badge>
        )}
        {params ? (
          <FilterBadge
            href={href(`job:${question.job_type}`)}
            active={active === `job:${question.job_type}`}
          >
            {jobTypeLabel(question.job_type)}
          </FilterBadge>
        ) : (
          <Badge>{jobTypeLabel(question.job_type)}</Badge>
        )}
        <UrgencyBadge
          urgency={question.urgency}
          href={params ? href(`urgency:${question.urgency}`) : undefined}
          active={active === `urgency:${question.urgency}`}
        />
        <RiskBadge
          risk={question.risk}
          href={params ? href(`risk:${question.risk}`) : undefined}
          active={active === `risk:${question.risk}`}
        />
        {question.status === "resolved" && (
          <Badge variant="green">
            <CheckCircle2 className="h-3 w-3" /> Resolved
          </Badge>
        )}
      </div>
      <Link href={`/questions/${question.id}`}>
        <h2 className="text-base font-semibold text-white hover:text-spark-300">
          {question.title}
        </h2>
      </Link>
      <p className="mt-1 line-clamp-2 text-sm text-ink-400">{question.body}</p>
      {question.tags && question.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {question.tags.map((t) =>
            params ? (
              <Link
                key={t.id}
                href={href(`tag:${t.slug}`)}
                scroll={false}
                aria-pressed={active === `tag:${t.slug}`}
                className={
                  "rounded bg-ink-800 px-2 py-0.5 text-xs text-ink-400 transition hover:text-ink-200 hover:brightness-125" +
                  (active === `tag:${t.slug}`
                    ? " ring-2 ring-spark-400/70 ring-offset-1 ring-offset-ink-900 text-ink-200"
                    : "")
                }
              >
                {t.name}
              </Link>
            ) : (
              <span
                key={t.id}
                className="rounded bg-ink-800 px-2 py-0.5 text-xs text-ink-400"
              >
                {t.name}
              </span>
            )
          )}
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        {question.author && <AuthorChip author={question.author} />}
        <div className="flex items-center gap-3 text-xs text-ink-500">
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            {question.answer_count ?? 0}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {question.view_count}
          </span>
          <span>{timeAgo(question.created_at)}</span>
        </div>
      </div>
    </article>
  );
}
