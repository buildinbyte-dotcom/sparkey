import Link from "next/link";
import { PlusCircle, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { QuestionCard } from "@/components/QuestionCard";
import { SafetyBanner } from "@/components/SafetyBanner";
import { AU_STATES, JOB_TYPES } from "@/lib/constants";
import type { Question } from "@/lib/types";

export const metadata = { title: "Feed" };

type SearchParams = Promise<{
  q?: string;
  state?: string;
  job_type?: string;
  urgent?: string;
}>;

export default async function FeedPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("questions")
    .select(
      `*,
      author:profiles!questions_author_id_fkey (*),
      tags:tags (*),
      answers:answers!answers_question_id_fkey (count)`
    )
    .neq("status", "removed")
    .order("created_at", { ascending: false })
    .limit(30);

  if (params.q) query = query.textSearch("search", params.q, { type: "websearch" });
  if (params.state) query = query.eq("state", params.state);
  if (params.job_type) query = query.eq("job_type", params.job_type);
  if (params.urgent) query = query.in("urgency", ["same_day", "stuck_on_site"]);

  const { data } = await query;

  const questions: Question[] = (data ?? []).map((q) => ({
    ...q,
    answer_count: q.answers?.[0]?.count ?? 0,
  }));

  return (
    <div className="space-y-4">
      <SafetyBanner />

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-white">Job-site questions</h1>
        <Link href="/ask" className="btn-primary">
          <PlusCircle className="h-4 w-4" /> Ask
        </Link>
      </div>

      <form method="get" className="flex flex-wrap gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Search solved problems first…"
            className="field pl-9"
          />
        </div>
        <select name="state" defaultValue={params.state ?? ""} className="field w-auto">
          <option value="">All states</option>
          {AU_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select name="job_type" defaultValue={params.job_type ?? ""} className="field w-auto">
          <option value="">All categories</option>
          {JOB_TYPES.map((j) => (
            <option key={j.value} value={j.value}>
              {j.label}
            </option>
          ))}
        </select>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-ink-700 bg-ink-900 px-3 text-sm text-ink-300">
          <input
            type="checkbox"
            name="urgent"
            value="1"
            defaultChecked={!!params.urgent}
            className="accent-spark-400"
          />
          Urgent only
        </label>
        <button type="submit" className="btn-secondary">
          Filter
        </button>
      </form>

      {questions.length === 0 ? (
        <div className="card py-16 text-center text-ink-500">
          <p className="font-medium text-ink-300">No questions found</p>
          <p className="mt-1 text-sm">
            {params.q
              ? "Try different keywords, or be the first to ask."
              : "Be the first to ask a question."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <QuestionCard key={q.id} question={q} />
          ))}
        </div>
      )}
    </div>
  );
}
