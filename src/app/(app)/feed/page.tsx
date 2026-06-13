import Link from "next/link";
import { PlusCircle, Search, X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { QuestionCard } from "@/components/QuestionCard";
import { SafetyBanner } from "@/components/SafetyBanner";
import { AU_STATES, JOB_TYPES, jobTypeLabel, riskLabel, urgencyLabel } from "@/lib/constants";
import { activeFilters, feedFilterHref, type FeedParams } from "@/lib/utils";
import type { Question } from "@/lib/types";

export const metadata = { title: "Feed" };

type SearchParams = Promise<FeedParams>;

// Human-readable label for an active clickable badge filter token.
function activeFilterLabel(token: string): string | null {
  const [kind, ...rest] = token.split(":");
  const value = rest.join(":");
  if (!value) return null;
  if (kind === "state") return value;
  if (kind === "job") return jobTypeLabel(value);
  if (kind === "urgency") return urgencyLabel(value);
  if (kind === "risk") return riskLabel(value);
  if (kind === "tag") return `#${value}`;
  return null;
}

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

  // Apply the clickable badge filters ("f"). Each token of the form "kind:value"
  // narrows the feed further on top of the form filters above (additive / AND).
  const filters = activeFilters(params);
  for (const token of filters) {
    const [kind, ...rest] = token.split(":");
    const value = rest.join(":");
    if (!value) continue;
    if (kind === "state") query = query.eq("state", value);
    else if (kind === "job") query = query.eq("job_type", value);
    else if (kind === "urgency") query = query.eq("urgency", value);
    else if (kind === "risk") query = query.eq("risk", value);
    else if (kind === "tag") {
      const { data: tagged } = await supabase
        .from("question_tags")
        .select("question_id, tags!inner(slug)")
        .eq("tags.slug", value);
      const ids = (tagged ?? []).map((r) => r.question_id);
      // Use a sentinel id so a tag with no matches returns an empty feed.
      query = query.in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to load feed:", error);
  }

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
        {/* Keep active badge filters when re-submitting the top filter. */}
        {filters.map((t) => (
          <input key={t} type="hidden" name="f" value={t} />
        ))}
        <button type="submit" className="btn-secondary">
          Filter
        </button>
      </form>

      {filters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-ink-400">
          <span>Filtered by</span>
          {filters.map((t) => {
            const label = activeFilterLabel(t);
            if (!label) return null;
            return (
              <Link
                key={t}
                href={feedFilterHref(params, t)}
                scroll={false}
                className="inline-flex items-center gap-1 rounded-full border border-spark-400/30 bg-spark-400/10 px-2.5 py-0.5 text-xs font-medium text-spark-300 transition hover:brightness-125"
              >
                {label}
                <X className="h-3 w-3" />
              </Link>
            );
          })}
        </div>
      )}

      {error ? (
        <div className="card py-16 text-center text-ink-500">
          <p className="font-medium text-red-300">Couldn&apos;t load the feed</p>
          <p className="mt-1 text-sm">Something went wrong on our end. Please try again shortly.</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="card py-16 text-center text-ink-500">
          <p className="font-medium text-ink-300">No questions found</p>
          <p className="mt-1 text-sm">
            {params.q || params.f
              ? "Try different filters, or be the first to ask."
              : "Be the first to ask a question."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <QuestionCard key={q.id} question={q} params={params} />
          ))}
        </div>
      )}
    </div>
  );
}
