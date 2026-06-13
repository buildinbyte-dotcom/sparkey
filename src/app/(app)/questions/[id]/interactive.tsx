"use client";

import { useState, useTransition } from "react";
import { ThumbsUp, CheckCircle2, Flag, ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";
import { FLAG_REASONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  acceptAnswer,
  addOutcome,
  flagContent,
  postAnswer,
  postComment,
  reviewAnswer,
  toggleHelpful,
} from "./actions";

export function HelpfulButton({
  questionId,
  answerId,
  count,
  hasVoted,
  canVote,
}: {
  questionId: string;
  answerId: string;
  count: number;
  hasVoted: boolean;
  canVote: boolean;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={!canVote || pending}
      onClick={() => startTransition(() => toggleHelpful(questionId, answerId, hasVoted))}
      title={canVote ? "Mark as helpful" : "Verified members can vote"}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition",
        hasVoted
          ? "border-spark-400/40 bg-spark-400/10 text-spark-300"
          : "border-ink-700 text-ink-400 hover:border-ink-500 hover:text-ink-200",
        !canVote && "cursor-not-allowed opacity-50"
      )}
    >
      <ThumbsUp className="h-3.5 w-3.5" />
      Helpful · {count}
    </button>
  );
}

export function AcceptButton({ questionId, answerId }: { questionId: string; answerId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => acceptAnswer(questionId, answerId))}
      className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 px-2.5 py-1.5 text-xs text-emerald-300 transition hover:bg-emerald-500/10"
    >
      <CheckCircle2 className="h-3.5 w-3.5" />
      {pending ? "Accepting…" : "Accept answer"}
    </button>
  );
}

export function FlagButton({
  questionId,
  targetType,
  targetId,
}: {
  questionId: string;
  targetType: "question" | "answer" | "comment";
  targetId: string;
}) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  if (sent) return <span className="text-xs text-emerald-400">Flag sent — thanks</span>;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-ink-500 transition hover:text-red-400"
      >
        <Flag className="h-3.5 w-3.5" /> Flag
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            action={(fd) =>
              startTransition(async () => {
                await flagContent(questionId, targetType, targetId, fd);
                setSent(true);
              })
            }
            className="w-full max-w-sm space-y-3 rounded-xl border border-ink-700 bg-ink-900 p-4 shadow-xl"
          >
            <select name="reason" className="field text-xs" defaultValue="unsafe">
              {FLAG_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <textarea name="detail" rows={2} placeholder="Details (optional)" className="field text-xs" />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-secondary flex-1 py-1.5 text-xs"
              >
                Cancel
              </button>
              <button type="submit" disabled={pending} className="btn-danger flex-1 py-1.5 text-xs">
                {pending ? "Sending…" : "Submit flag"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export function ExpertReviewButtons({
  questionId,
  answerId,
}: {
  questionId: string;
  answerId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  if (done) return <span className="text-xs text-emerald-400">Review recorded</span>;

  const act = (verdict: "confirmed_safe" | "disputed" | "unsafe") =>
    startTransition(async () => {
      await reviewAnswer(questionId, answerId, verdict);
      setDone(true);
    });

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-wide text-ink-600">Expert review:</span>
      <button
        disabled={pending}
        onClick={() => act("confirmed_safe")}
        className="flex items-center gap-1 rounded-lg border border-emerald-500/30 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/10"
      >
        <ShieldCheck className="h-3 w-3" /> Safe
      </button>
      <button
        disabled={pending}
        onClick={() => act("disputed")}
        className="flex items-center gap-1 rounded-lg border border-orange-500/30 px-2 py-1 text-xs text-orange-300 hover:bg-orange-500/10"
      >
        <ShieldQuestion className="h-3 w-3" /> Disputed
      </button>
      <button
        disabled={pending}
        onClick={() => act("unsafe")}
        className="flex items-center gap-1 rounded-lg border border-red-500/30 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10"
      >
        <ShieldAlert className="h-3 w-3" /> Unsafe
      </button>
    </div>
  );
}

export function AnswerForm({ questionId }: { questionId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          await postAnswer(questionId, fd);
        })
      }
      className="card space-y-3"
    >
      <h3 className="font-semibold text-white">Your answer</h3>
      <textarea
        name="body"
        required
        minLength={10}
        rows={5}
        placeholder="Share what you'd check first, readings to take, and anything safety-critical…"
        className="field"
      />
      <label className="flex items-center gap-2 text-xs text-ink-400">
        <input type="checkbox" name="includes_reference" className="accent-spark-400" />
        This answer references a standard, manual or supplier doc (+5 rep when accepted)
      </label>
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Posting…" : "Post answer"}
      </button>
    </form>
  );
}

export function CommentForm({
  questionId,
  target,
}: {
  questionId: string;
  target: { question_id?: string; answer_id?: string };
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-ink-500 hover:text-ink-300">
        Add clarifying comment
      </button>
    );
  }

  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          await postComment(questionId, target, fd);
          setOpen(false);
        })
      }
      className="flex gap-2"
    >
      <input
        name="body"
        required
        minLength={2}
        placeholder="Ask a clarifying question…"
        className="field text-xs"
      />
      <button type="submit" disabled={pending} className="btn-secondary py-1.5 text-xs">
        {pending ? "…" : "Post"}
      </button>
    </form>
  );
}

export function OutcomeForm({ questionId }: { questionId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          await addOutcome(questionId, fd);
        })
      }
      className="space-y-2"
    >
      <textarea
        name="outcome_note"
        required
        rows={3}
        placeholder="What ended up fixing it? Closing the loop earns you +3 rep and helps the next sparky."
        className="field text-sm"
      />
      <button type="submit" disabled={pending} className="btn-secondary text-xs">
        {pending ? "Saving…" : "Post outcome"}
      </button>
    </form>
  );
}
