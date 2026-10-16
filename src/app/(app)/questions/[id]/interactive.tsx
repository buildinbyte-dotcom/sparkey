"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ThumbsUp, CheckCircle2, Flag, ShieldCheck, ShieldAlert, ShieldQuestion, Trash2 } from "lucide-react";
import { FLAG_REASONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  acceptAnswer,
  addOutcome,
  deleteQuestion,
  flagContent,
  postAnswer,
  postComment,
  recordQuestionView,
  reviewAnswer,
  toggleHelpful,
} from "./actions";

/**
 * Increments the question view counter once per session visit on mount, rather
 * than inside the Server Component render (which re-runs on every revalidatePath).
 */
export function QuestionViewTracker({ questionId }: { questionId: string }) {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;
    const key = `sparkyq-viewed-${questionId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    recordQuestionView(questionId).catch(() => {});
  }, [questionId]);

  return null;
}

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
      onClick={() => startTransition(async () => { await toggleHelpful(questionId, answerId, hasVoted); })}
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
  const [error, setError] = useState("");
  return (
    <div className="inline-flex items-center gap-2">
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError("");
            const res = await acceptAnswer(questionId, answerId);
            if (res?.error) setError(res.error);
          })
        }
        className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 px-2.5 py-1.5 text-xs text-emerald-700 dark:text-emerald-300 transition hover:bg-emerald-500/10"
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        {pending ? "Accepting…" : "Accept answer"}
      </button>
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </div>
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
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  if (sent) return <span className="text-xs text-emerald-600 dark:text-emerald-400">Flag sent — thanks</span>;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-ink-500 transition hover:text-red-600 dark:hover:text-red-400"
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
                setError("");
                const res = await flagContent(questionId, targetType, targetId, fd);
                if (res?.error) {
                  setError(res.error);
                  return;
                }
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
            {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
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

export function DeleteQuestionButton({ questionId }: { questionId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-ink-500 transition hover:text-red-600 dark:hover:text-red-400"
      >
        <Trash2 className="h-3.5 w-3.5" /> Delete
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm space-y-3 rounded-xl border border-ink-700 bg-ink-900 p-4 shadow-xl"
          >
            <h3 className="font-semibold text-ink-50">Delete this question?</h3>
            <p className="text-xs text-ink-400">
              It will be removed from the feed and your profile. This can&apos;t be undone from here.
            </p>
            {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-secondary flex-1 py-1.5 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    setError("");
                    const res = await deleteQuestion(questionId);
                    if (res?.error) setError(res.error);
                  })
                }
                className="btn-danger flex-1 py-1.5 text-xs"
              >
                {pending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
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
  const [error, setError] = useState("");
  if (done) return <span className="text-xs text-emerald-600 dark:text-emerald-400">Review recorded</span>;

  const act = (verdict: "confirmed_safe" | "disputed" | "unsafe") =>
    startTransition(async () => {
      setError("");
      const res = await reviewAnswer(questionId, answerId, verdict);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setDone(true);
    });

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-wide text-ink-600">Expert review:</span>
      <button
        disabled={pending}
        onClick={() => act("confirmed_safe")}
        className="flex items-center gap-1 rounded-lg border border-emerald-500/30 px-2 py-1 text-xs text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
      >
        <ShieldCheck className="h-3 w-3" /> Safe
      </button>
      <button
        disabled={pending}
        onClick={() => act("disputed")}
        className="flex items-center gap-1 rounded-lg border border-orange-500/30 px-2 py-1 text-xs text-orange-700 dark:text-orange-300 hover:bg-orange-500/10"
      >
        <ShieldQuestion className="h-3 w-3" /> Disputed
      </button>
      <button
        disabled={pending}
        onClick={() => act("unsafe")}
        className="flex items-center gap-1 rounded-lg border border-red-500/30 px-2 py-1 text-xs text-red-700 dark:text-red-300 hover:bg-red-500/10"
      >
        <ShieldAlert className="h-3 w-3" /> Unsafe
      </button>
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
}

export function AnswerForm({ questionId }: { questionId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(fd) =>
        startTransition(async () => {
          setError("");
          const res = await postAnswer(questionId, fd);
          if (res?.error) {
            setError(res.error);
            return;
          }
          formRef.current?.reset();
        })
      }
      className="card space-y-3"
    >
      <h3 className="font-semibold text-ink-50">Your answer</h3>
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
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
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
  const [error, setError] = useState("");
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
          setError("");
          const res = await postComment(questionId, target, fd);
          if (res?.error) {
            setError(res.error);
            return;
          }
          setOpen(false);
        })
      }
      className="space-y-1"
    >
      <div className="flex gap-2">
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
      </div>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}

export function OutcomeForm({ questionId }: { questionId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          setError("");
          const res = await addOutcome(questionId, fd);
          if (res?.error) setError(res.error);
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
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      <button type="submit" disabled={pending} className="btn-secondary text-xs">
        {pending ? "Saving…" : "Post outcome"}
      </button>
    </form>
  );
}
