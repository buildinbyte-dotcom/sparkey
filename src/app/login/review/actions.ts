"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ReviewSignInState = { error?: string };

const GENERIC_ERROR = "These details don't match a review account.";

/**
 * Password sign-in for the App Store / Play reviewer account only, since reviewers
 * can't receive emailed codes. Any email other than APP_REVIEW_EMAIL is refused,
 * so this can't be used to get into normal (passwordless) accounts.
 */
export async function reviewSignIn(
  _prev: ReviewSignInState,
  formData: FormData
): Promise<ReviewSignInState> {
  const allowed = process.env.APP_REVIEW_EMAIL?.trim().toLowerCase();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!allowed || email !== allowed || !password) return { error: GENERIC_ERROR };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: GENERIC_ERROR };

  redirect("/feed");
}
