"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error?: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function recordQuestionView(questionId: string) {
  const supabase = await createClient();
  await supabase.rpc("increment_question_views", { p_question_id: questionId });
}

export async function postAnswer(questionId: string, formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const body = String(formData.get("body") ?? "").trim();
  const includesReference = formData.get("includes_reference") === "on";
  if (body.length < 10) {
    return { error: "Answer must be at least 10 characters." };
  }

  const { error } = await supabase.from("answers").insert({
    question_id: questionId,
    author_id: user.id,
    body,
    includes_reference: includesReference,
  });

  if (error) {
    return { error: "Could not post answer. Make sure your licence is verified." };
  }

  revalidatePath(`/questions/${questionId}`);
  return {};
}

export async function postComment(
  questionId: string,
  target: { question_id?: string; answer_id?: string },
  formData: FormData
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const body = String(formData.get("body") ?? "").trim();
  if (body.length < 2) {
    return { error: "Comment is too short." };
  }

  const { error } = await supabase.from("comments").insert({
    question_id: target.question_id ?? null,
    answer_id: target.answer_id ?? null,
    author_id: user.id,
    body,
  });

  if (error) {
    return { error: "Could not post comment. Please try again." };
  }

  revalidatePath(`/questions/${questionId}`);
  return {};
}

export async function toggleHelpful(
  questionId: string,
  answerId: string,
  hasVoted: boolean
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();

  const { error } = hasVoted
    ? await supabase.from("votes").delete().eq("user_id", user.id).eq("answer_id", answerId)
    : await supabase.from("votes").insert({ user_id: user.id, answer_id: answerId });

  if (error) {
    return { error: "Could not update vote." };
  }

  revalidatePath(`/questions/${questionId}`);
  return {};
}

export async function acceptAnswer(questionId: string, answerId: string): Promise<ActionResult> {
  const { supabase } = await requireUser();

  const { error } = await supabase.rpc("accept_answer", {
    p_question_id: questionId,
    p_answer_id: answerId,
  });

  if (error) {
    return { error: "Could not accept answer. Please try again." };
  }

  revalidatePath(`/questions/${questionId}`);
  revalidatePath("/feed");
  return {};
}

export async function addOutcome(questionId: string, formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const note = String(formData.get("outcome_note") ?? "").trim();
  if (!note) return { error: "Please enter what fixed it." };

  const { error } = await supabase
    .from("questions")
    .update({ outcome_note: note })
    .eq("id", questionId)
    .eq("author_id", user.id);

  if (error) {
    return { error: "Could not save outcome note." };
  }

  revalidatePath(`/questions/${questionId}`);
  return {};
}

export async function deleteQuestion(questionId: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();

  // Soft delete: the row stays in the database, we just flip its status to
  // 'removed' so it drops out of feeds and profiles. RLS limits this update to
  // the question author (or an admin).
  const { error } = await supabase
    .from("questions")
    .update({ status: "removed" })
    .eq("id", questionId)
    .eq("author_id", user.id);

  if (error) {
    return { error: "Could not delete question." };
  }

  revalidatePath("/feed");
  redirect("/feed");
}

export async function flagContent(
  questionId: string,
  targetType: "question" | "answer" | "comment",
  targetId: string,
  formData: FormData
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const reason = String(formData.get("reason") ?? "other");
  const detail = String(formData.get("detail") ?? "").trim();

  const { error } = await supabase.from("flags").insert({
    reporter_id: user.id,
    target_type: targetType,
    target_id: targetId,
    reason,
    detail: detail || null,
  });

  if (error) {
    return { error: "Could not submit flag." };
  }

  revalidatePath(`/questions/${questionId}`);
  return {};
}

export async function reviewAnswer(
  questionId: string,
  answerId: string,
  verdict: "confirmed_safe" | "disputed" | "unsafe"
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();

  const { error } = await supabase.from("answer_reviews").insert({
    answer_id: answerId,
    reviewer_id: user.id,
    verdict,
  });

  if (error) {
    return { error: "Could not record review." };
  }

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
  return {};
}
