import { notFound } from "next/navigation";
import { CheckCircle2, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge, RiskBadge, UrgencyBadge } from "@/components/Badge";
import { AuthorChip } from "@/components/AuthorChip";
import { SafetyBanner } from "@/components/SafetyBanner";
import { jobTypeLabel } from "@/lib/constants";
import { mediaUrl, timeAgo } from "@/lib/utils";
import type { Answer, Comment, Profile, Question, QuestionMedia, Tag } from "@/lib/types";
import {
  AcceptButton,
  AnswerForm,
  CommentForm,
  DeleteQuestionButton,
  ExpertReviewButtons,
  FlagButton,
  HelpfulButton,
  OutcomeForm,
} from "./interactive";

export const metadata = { title: "Question" };

export default async function QuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    {
      data: { user },
    },
    { data: question },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("questions")
      .select(
        `*,
      author:profiles!questions_author_id_fkey (*),
      tags:tags (*),
      question_media (*)`
      )
      .eq("id", id)
      .maybeSingle(),
  ]);

  if (!question) notFound();

  const q = question as Question & { question_media: QuestionMedia[]; tags: Tag[] };

  const [{ data: answersData }, { data: votesData }, { data: viewer }] = await Promise.all([
    supabase
      .from("answers")
      .select(`*, author:profiles!answers_author_id_fkey (*)`)
      .eq("question_id", id)
      .eq("is_removed", false)
      .order("is_accepted", { ascending: false })
      .order("helpful_count", { ascending: false })
      .order("created_at", { ascending: true }),
    user ? supabase.from("votes").select("answer_id").eq("user_id", user.id) : { data: [] },
    user ? supabase.from("profiles").select("*").eq("id", user.id).maybeSingle() : { data: null },
  ]);

  const answers = (answersData ?? []) as Answer[];
  const answerIds = new Set(answers.map((a) => a.id));

  const answerIdList = answers.map((a) => a.id).join(",");
  const [{ data: commentsData }] = await Promise.all([
    supabase
      .from("comments")
      .select(`*, author:profiles!comments_author_id_fkey (*)`)
      .or(
        answerIdList
          ? `question_id.eq.${id},answer_id.in.(${answerIdList})`
          : `question_id.eq.${id}`
      )
      .eq("is_removed", false)
      .order("created_at", { ascending: true }),
    supabase.rpc("increment_question_views", { p_question_id: id }),
  ]);

  const allComments = (commentsData ?? []) as Comment[];
  const questionComments = allComments.filter((c) => c.question_id === id);
  const commentsByAnswer = new Map<string, Comment[]>();
  for (const c of allComments) {
    if (c.answer_id && answerIds.has(c.answer_id)) {
      const list = commentsByAnswer.get(c.answer_id) ?? [];
      list.push(c);
      commentsByAnswer.set(c.answer_id, list);
    }
  }

  const votedAnswerIds = new Set((votesData ?? []).map((v: { answer_id: string }) => v.answer_id));
  const me = viewer as Profile | null;
  const isAuthor = me?.id === q.author_id;
  const isVerified = me?.verification_status === "verified";
  const isExpert = !!me && (me.is_expert || me.is_moderator || me.is_admin);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <SafetyBanner />

      {(q.risk === "high" || q.risk === "needs_expert" || q.needs_expert_review) && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
          ⚠ High-risk topic. Treat all suggestions with caution, verify isolation and test before
          touch, and follow your state&apos;s requirements. Work must be done by appropriately
          licensed people.
        </div>
      )}

      <article className="card">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge variant="blue">{q.state}</Badge>
          <Badge>{jobTypeLabel(q.job_type)}</Badge>
          <UrgencyBadge urgency={q.urgency} />
          <RiskBadge risk={q.risk} />
          {q.status === "resolved" && (
            <Badge variant="green">
              <CheckCircle2 className="h-3 w-3" /> Resolved
            </Badge>
          )}
        </div>
        <h1 className="text-xl font-bold text-white">{q.title}</h1>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-300">{q.body}</p>

        {q.question_media.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {q.question_media.map((m) => (
              <a key={m.id} href={mediaUrl(m.storage_path)} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mediaUrl(m.storage_path)}
                  alt="job site photo"
                  className="h-28 w-28 rounded-lg border border-ink-700 object-cover transition hover:opacity-80"
                />
              </a>
            ))}
          </div>
        )}

        {q.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {q.tags.map((t) => (
              <span key={t.id} className="rounded bg-ink-800 px-2 py-0.5 text-xs text-ink-400">
                {t.name}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-ink-800 pt-4">
          {q.author && <AuthorChip author={q.author} />}
          <div className="flex items-center gap-3 text-xs text-ink-500">
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" /> {q.view_count}
            </span>
            <span>{timeAgo(q.created_at)}</span>
            <FlagButton questionId={q.id} targetType="question" targetId={q.id} />
            {isAuthor && <DeleteQuestionButton questionId={q.id} />}
          </div>
        </div>

        {questionComments.length > 0 && (
          <div className="mt-3 space-y-2 border-t border-ink-800 pt-3">
            {questionComments.map((c) => (
              <p key={c.id} className="text-xs text-ink-400">
                <span className="font-medium text-ink-300">{c.author?.display_name}:</span> {c.body}
                <span className="ml-2 text-ink-600">{timeAgo(c.created_at)}</span>
              </p>
            ))}
          </div>
        )}
        <div className="mt-3">
          <CommentForm questionId={q.id} target={{ question_id: q.id }} />
        </div>
      </article>

      {q.outcome_note ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <h3 className="mb-1 text-sm font-semibold text-emerald-300">✓ Outcome — what fixed it</h3>
          <p className="whitespace-pre-wrap text-sm text-ink-300">{q.outcome_note}</p>
        </div>
      ) : (
        isAuthor &&
        q.status === "resolved" && (
          <div className="card">
            <h3 className="mb-2 text-sm font-semibold text-white">Close the loop</h3>
            <OutcomeForm questionId={q.id} />
          </div>
        )
      )}

      <section className="space-y-3">
        <h2 className="font-semibold text-white">
          {answers.length} {answers.length === 1 ? "answer" : "answers"}
        </h2>

        {answers.map((a) => (
          <article
            key={a.id}
            className={`card ${a.is_accepted ? "border-emerald-500/40 bg-emerald-500/5" : ""}`}
          >
            {a.is_accepted && (
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                <CheckCircle2 className="h-4 w-4" /> Accepted answer
              </p>
            )}
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-200">{a.body}</p>
            {a.includes_reference && (
              <p className="mt-2 text-xs text-spark-300">📎 References a standard or manual</p>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-ink-800 pt-3">
              {a.author && <AuthorChip author={a.author} />}
              <span className="text-xs text-ink-500">{timeAgo(a.created_at)}</span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <HelpfulButton
                questionId={q.id}
                answerId={a.id}
                count={a.helpful_count}
                hasVoted={votedAnswerIds.has(a.id)}
                canVote={isVerified && me?.id !== a.author_id}
              />
              {isAuthor && !a.is_accepted && q.status !== "removed" && (
                <AcceptButton questionId={q.id} answerId={a.id} />
              )}
              {isExpert && me?.id !== a.author_id && (
                <ExpertReviewButtons questionId={q.id} answerId={a.id} />
              )}
              <FlagButton questionId={q.id} targetType="answer" targetId={a.id} />
            </div>

            {(commentsByAnswer.get(a.id) ?? []).length > 0 && (
              <div className="mt-3 space-y-1.5 border-t border-ink-800 pt-3">
                {(commentsByAnswer.get(a.id) ?? []).map((c) => (
                  <p key={c.id} className="text-xs text-ink-400">
                    <span className="font-medium text-ink-300">{c.author?.display_name}:</span>{" "}
                    {c.body}
                  </p>
                ))}
              </div>
            )}
            <div className="mt-2">
              <CommentForm questionId={q.id} target={{ answer_id: a.id }} />
            </div>
          </article>
        ))}

        {isVerified ? (
          <AnswerForm questionId={q.id} />
        ) : (
          <div className="card text-center text-sm text-ink-400">
            {me?.verification_status === "pending"
              ? "Your licence verification is being reviewed — you'll be able to answer once verified."
              : "Only verified electricians can answer. Add your licence details in onboarding to get verified."}
          </div>
        )}
      </section>
    </div>
  );
}
