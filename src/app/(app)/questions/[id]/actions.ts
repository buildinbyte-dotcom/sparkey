"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function postAnswer(questionId: string, formData: FormData) {
  const { supabase, user } = await requireUser();
  const body = String(formData.get("body") ?? "").trim();
  const includesReference = formData.get("includes_reference") === "on";
  if (body.length < 10) return;

  await supabase.from("answers").insert({
    question_id: questionId,
    author_id: user.id,
    body,
    includes_reference: includesReference,
  });

  revalidatePath(`/questions/${questionId}`);
}

export async function postComment(
  questionId: string,
  target: { question_id?: string; answer_id?: string },
  formData: FormData
) {
  const { supabase, user } = await requireUser();
  const body = String(formData.get("body") ?? "").trim();
  if (body.length < 2) return;

  await supabase.from("comments").insert({
    question_id: target.question_id ?? null,
    answer_id: target.answer_id ?? null,
    author_id: user.id,
    body,
  });

  revalidatePath(`/questions/${questionId}`);
}

export async function toggleHelpful(questionId: string, answerId: string, hasVoted: boolean) {
  const { supabase, user } = await requireUser();

  if (hasVoted) {
    await supabase.from("votes").delete().eq("user_id", user.id).eq("answer_id", answerId);
  } else {
    await supabase.from("votes").insert({ user_id: user.id, answer_id: answerId });
  }

  revalidatePath(`/questions/${questionId}`);
}

export async function acceptAnswer(questionId: string, answerId: string) {
  const { supabase, user } = await requireUser();

  // RLS restricts updates to the question author.
  const { data: question } = await supabase
    .from("questions")
    .select("id, author_id, accepted_answer_id")
    .eq("id", questionId)
    .single();
  if (!question || question.author_id !== user.id) return;

  if (question.accepted_answer_id) {
    await supabase
      .from("answers")
      .update({ is_accepted: false })
      .eq("id", question.accepted_answer_id);
  }

  await supabase.from("answers").update({ is_accepted: true }).eq("id", answerId);
  await supabase
    .from("questions")
    .update({ accepted_answer_id: answerId, status: "resolved" })
    .eq("id", questionId);

  revalidatePath(`/questions/${questionId}`);
}

export async function addOutcome(questionId: string, formData: FormData) {
  const { supabase, user } = await requireUser();
  const note = String(formData.get("outcome_note") ?? "").trim();
  if (!note) return;

  await supabase
    .from("questions")
    .update({ outcome_note: note })
    .eq("id", questionId)
    .eq("author_id", user.id);

  revalidatePath(`/questions/${questionId}`);
}

export async function flagContent(
  questionId: string,
  targetType: "question" | "answer" | "comment",
  targetId: string,
  formData: FormData
) {
  const { supabase, user } = await requireUser();
  const reason = String(formData.get("reason") ?? "other");
  const detail = String(formData.get("detail") ?? "").trim();

  await supabase.from("flags").insert({
    reporter_id: user.id,
    target_type: targetType,
    target_id: targetId,
    reason,
    detail: detail || null,
  });

  revalidatePath(`/questions/${questionId}`);
}

export async function reviewAnswer(
  questionId: string,
  answerId: string,
  verdict: "confirmed_safe" | "disputed" | "unsafe"
) {
  const { supabase, user } = await requireUser();

  await supabase.from("answer_reviews").insert({
    answer_id: answerId,
    reviewer_id: user.id,
    verdict,
  });

  // An unsafe verdict also raises a safety flag for the moderation queue.
  if (verdict === "unsafe") {
    await supabase.from("flags").insert({
      reporter_id: user.id,
      target_type: "answer",
      target_id: answerId,
      reason: "unsafe",
      detail: "Marked unsafe by expert reviewer.",
    });
  }

  revalidatePath(`/questions/${questionId}`);
}
