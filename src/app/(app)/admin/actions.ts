"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, is_moderator")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || (!profile.is_admin && !profile.is_moderator)) redirect("/feed");

  return supabase;
}

export async function reviewLicence(verificationId: string, approve: boolean, notes?: string) {
  const supabase = await requireStaff();
  await supabase.rpc("review_licence", {
    p_verification_id: verificationId,
    p_approve: approve,
    p_notes: notes ?? null,
  });
  revalidatePath("/admin");
}

export async function resolveFlag(flagId: string, uphold: boolean, penalty = 25) {
  const supabase = await requireStaff();
  await supabase.rpc("resolve_flag", {
    p_flag_id: flagId,
    p_uphold: uphold,
    p_penalty: penalty,
  });
  revalidatePath("/admin");
}
