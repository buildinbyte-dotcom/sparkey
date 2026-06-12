import { notFound } from "next/navigation";
import { Award, ShieldCheck, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge, VerifiedBadge } from "@/components/Badge";
import { QuestionCard } from "@/components/QuestionCard";
import { jobTypeLabel, tradeRoleLabel } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";
import type { CategoryScore, Profile, Question } from "@/lib/types";

export const metadata = { title: "Profile" };

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("handle", handle)
    .maybeSingle<Profile>();

  if (!profile) notFound();

  const [{ data: categoryScores }, { data: recentQuestions }, { count: answerCount }, { count: acceptedCount }] =
    await Promise.all([
      supabase
        .from("user_category_scores")
        .select("*")
        .eq("user_id", profile.id)
        .order("score", { ascending: false }),
      supabase
        .from("questions")
        .select(`*, author:profiles!questions_author_id_fkey (*), tags:tags (*), answers (count)`)
        .eq("author_id", profile.id)
        .neq("status", "removed")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("answers")
        .select("id", { count: "exact", head: true })
        .eq("author_id", profile.id)
        .eq("is_removed", false),
      supabase
        .from("answers")
        .select("id", { count: "exact", head: true })
        .eq("author_id", profile.id)
        .eq("is_accepted", true),
    ]);

  const questions: Question[] = (recentQuestions ?? []).map((q) => ({
    ...q,
    answer_count: q.answers?.[0]?.count ?? 0,
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">{profile.display_name}</h1>
            <p className="mt-1 text-sm text-ink-400">
              {profile.state} {tradeRoleLabel(profile.trade_role)}
              {profile.years_experience > 0 && ` · ${profile.years_experience} yrs experience`}
              {` · joined ${timeAgo(profile.created_at)}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <VerifiedBadge status={profile.verification_status} />
            {profile.is_expert && (
              <Badge variant="spark">
                <Award className="h-3 w-3" /> Expert reviewer
              </Badge>
            )}
            {profile.is_founding_member && <Badge variant="blue">Founding member</Badge>}
          </div>
        </div>

        {profile.bio && <p className="mt-4 text-sm text-ink-300">{profile.bio}</p>}

        {profile.specialisations.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {profile.specialisations.map((s) => (
              <span key={s} className="rounded bg-ink-800 px-2 py-0.5 text-xs text-ink-400">
                {s}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-ink-800 pt-5 sm:grid-cols-4">
          <Stat icon={Zap} label="Reputation" value={profile.reputation} highlight />
          <Stat icon={ShieldCheck} label="Safety score" value={profile.safety_score} />
          <Stat label="Answers" value={answerCount ?? 0} />
          <Stat label="Accepted" value={acceptedCount ?? 0} />
        </div>
      </div>

      {(categoryScores ?? []).length > 0 && (
        <div className="card">
          <h2 className="mb-3 font-semibold text-white">Reputation by category</h2>
          <div className="space-y-2">
            {(categoryScores as CategoryScore[]).map((c) => (
              <div key={c.category} className="flex items-center justify-between text-sm">
                <span className="text-ink-300">{jobTypeLabel(c.category)}</span>
                <span className="font-semibold text-spark-300">{c.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {questions.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-white">Recent questions</h2>
          {questions.map((q) => (
            <QuestionCard key={q.id} question={q} />
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg bg-ink-900 p-3 text-center">
      <p className={`text-xl font-bold ${highlight ? "text-spark-300" : "text-white"}`}>
        {value}
      </p>
      <p className="mt-0.5 flex items-center justify-center gap-1 text-xs text-ink-500">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </p>
    </div>
  );
}
