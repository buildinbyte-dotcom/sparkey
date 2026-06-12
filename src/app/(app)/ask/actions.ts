"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AskState = { error?: string };

export async function createQuestion(_prev: AskState, formData: FormData): Promise<AskState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const state = String(formData.get("state") ?? "");
  const jobType = String(formData.get("job_type") ?? "other");
  const urgency = String(formData.get("urgency") ?? "normal");
  const risk = String(formData.get("risk") ?? "low");
  const tagIds = formData.getAll("tag_ids").map(String).filter(Boolean);
  const mediaPaths = formData.getAll("media_paths").map(String).filter(Boolean);

  if (title.length < 8) return { error: "Title must be at least 8 characters." };
  if (body.length < 10) return { error: "Please describe the problem in more detail." };
  if (!state) return { error: "Please choose the state this job is in." };

  const { data: question, error } = await supabase
    .from("questions")
    .insert({
      author_id: user.id,
      title,
      body,
      state,
      job_type: jobType,
      urgency,
      risk,
    })
    .select("id")
    .single();

  if (error || !question) {
    return { error: "Could not post your question. Please try again." };
  }

  if (tagIds.length > 0) {
    await supabase
      .from("question_tags")
      .insert(tagIds.slice(0, 5).map((tagId) => ({ question_id: question.id, tag_id: tagId })));
  }

  if (mediaPaths.length > 0) {
    await supabase
      .from("question_media")
      .insert(
        mediaPaths
          .slice(0, 6)
          .map((p) => ({ question_id: question.id, storage_path: p, media_type: "image" }))
      );
  }

  revalidatePath("/feed");
  redirect(`/questions/${question.id}`);
}
