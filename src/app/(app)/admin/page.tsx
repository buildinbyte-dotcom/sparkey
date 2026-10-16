import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert, UserCheck, Users, Flag as FlagIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/Badge";
import { timeAgo } from "@/lib/utils";
import { FlagActions, LicenceActions } from "./AdminActions";
import type { Flag, LicenceVerification, Profile } from "@/lib/types";

export const metadata = { title: "Admin" };

type VerificationWithProfile = LicenceVerification & { profile: Profile };

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin, is_moderator")
    .eq("id", user.id)
    .maybeSingle();
  if (!me || (!me.is_admin && !me.is_moderator)) redirect("/feed");

  const [
    { data: pendingVerifications },
    { data: openFlags },
    { count: userCount },
    { count: verifiedCount },
    { count: questionCount },
  ] = await Promise.all([
    supabase
      .from("licence_verifications")
      .select(`*, profile:profiles!licence_verifications_user_id_fkey (*)`)
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    supabase.from("flags").select("*").eq("status", "open").order("created_at", { ascending: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("verification_status", "verified"),
    supabase.from("questions").select("id", { count: "exact", head: true }),
  ]);

  const verifications = (pendingVerifications ?? []) as VerificationWithProfile[];
  const flags = (openFlags ?? []) as Flag[];

  // Resolve target previews & parent question links for all open flags
  const questionIds = flags.filter((f) => f.target_type === "question").map((f) => f.target_id);
  const answerIds = flags.filter((f) => f.target_type === "answer").map((f) => f.target_id);
  const commentIds = flags.filter((f) => f.target_type === "comment").map((f) => f.target_id);

  const [flaggedQuestionsRes, flaggedAnswersRes, flaggedCommentsRes] = await Promise.all([
    questionIds.length > 0
      ? supabase.from("questions").select("id, title, body").in("id", questionIds)
      : Promise.resolve({ data: [] as { id: string; title: string; body: string }[] }),
    answerIds.length > 0
      ? supabase.from("answers").select("id, question_id, body").in("id", answerIds)
      : Promise.resolve({ data: [] as { id: string; question_id: string; body: string }[] }),
    commentIds.length > 0
      ? supabase
          .from("comments")
          .select("id, question_id, body, answer:answers!comments_answer_id_fkey(question_id)")
          .in("id", commentIds)
      : Promise.resolve({
          data: [] as {
            id: string;
            question_id: string | null;
            body: string;
            answer?: { question_id: string } | { question_id: string }[] | null;
          }[],
        }),
  ]);

  const targetMeta = new Map<string, { questionId: string | null; snippet: string }>();
  for (const q of flaggedQuestionsRes.data ?? []) {
    targetMeta.set(q.id, {
      questionId: q.id,
      snippet: `${q.title} — ${q.body}`.slice(0, 220),
    });
  }
  for (const a of flaggedAnswersRes.data ?? []) {
    targetMeta.set(a.id, {
      questionId: a.question_id,
      snippet: a.body.slice(0, 220),
    });
  }
  for (const c of flaggedCommentsRes.data ?? []) {
    const ans = Array.isArray(c.answer) ? c.answer[0] : c.answer;
    targetMeta.set(c.id, {
      questionId: c.question_id ?? ans?.question_id ?? null,
      snippet: c.body.slice(0, 220),
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2 text-xl font-bold text-ink-50">
        <ShieldAlert className="h-5 w-5 text-spark-400" /> Moderation dashboard
      </h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Users} label="Members" value={userCount ?? 0} />
        <StatCard icon={UserCheck} label="Verified" value={verifiedCount ?? 0} />
        <StatCard icon={FlagIcon} label="Open flags" value={flags.length} />
        <StatCard icon={ShieldAlert} label="Pending licences" value={verifications.length} />
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold text-ink-50">
          Licence verification queue ({verifications.length})
        </h2>
        {verifications.length === 0 ? (
          <p className="card py-8 text-center text-sm text-ink-500">Queue is clear.</p>
        ) : (
          verifications.map((v) => (
            <div key={v.id} className="card flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-ink-100">
                  {v.profile?.real_name || v.profile?.display_name}{" "}
                  <span className="text-ink-500">(@{v.profile?.handle})</span>
                </p>
                <p className="mt-0.5 text-xs text-ink-400">
                  {v.state} · Licence {v.licence_number}
                  {v.licence_class && ` · ${v.licence_class}`} · submitted {timeAgo(v.created_at)}
                </p>
                <p className="mt-1 text-xs text-ink-600">
                  Check against the {v.state} public register before approving.
                </p>
              </div>
              <LicenceActions verificationId={v.id} />
            </div>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-ink-50">Flag queue ({flags.length})</h2>
        {flags.length === 0 ? (
          <p className="card py-8 text-center text-sm text-ink-500">No open flags.</p>
        ) : (
          flags.map((f) => {
            const meta = targetMeta.get(f.target_id);
            return (
              <div key={f.id} className="card space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={f.reason === "unsafe" ? "red" : "orange"}>{f.reason}</Badge>
                  <Badge>{f.target_type}</Badge>
                  <span className="text-xs text-ink-500">{timeAgo(f.created_at)}</span>
                  {meta?.questionId && (
                    <Link
                      href={`/questions/${meta.questionId}`}
                      className="text-xs text-spark-300 hover:underline"
                    >
                      View in thread →
                    </Link>
                  )}
                </div>
                {meta?.snippet && (
                  <blockquote className="rounded-lg border border-ink-800 bg-ink-950 p-2.5 text-xs text-ink-300">
                    &ldquo;{meta.snippet}
                    {meta.snippet.length >= 220 ? "…" : ""}&rdquo;
                  </blockquote>
                )}
                {f.detail && (
                  <p className="text-sm text-ink-300">
                    <span className="text-xs font-medium text-ink-500">Reporter note: </span>
                    {f.detail}
                  </p>
                )}
                <FlagActions flagId={f.id} isUnsafe={f.reason === "unsafe"} />
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="card py-4 text-center">
      <Icon className="mx-auto mb-1 h-4 w-4 text-spark-400" />
      <p className="text-xl font-bold text-ink-50">{value}</p>
      <p className="text-xs text-ink-500">{label}</p>
    </div>
  );
}
