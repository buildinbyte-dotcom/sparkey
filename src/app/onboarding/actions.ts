"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugifyHandle } from "@/lib/utils";

export type OnboardingState = { error?: string };

export async function completeOnboarding(
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const displayName = String(formData.get("display_name") ?? "").trim();
  const realName = String(formData.get("real_name") ?? "").trim();
  const state = String(formData.get("state") ?? "");
  const tradeRole = String(formData.get("trade_role") ?? "electrician");
  const years = Number(formData.get("years_experience") ?? 0);
  const specialisations = formData.getAll("specialisations").map(String);
  const licenceNumber = String(formData.get("licence_number") ?? "").trim();
  const licenceClass = String(formData.get("licence_class") ?? "").trim();

  if (displayName.length < 2) return { error: "Display name must be at least 2 characters." };
  if (!state) return { error: "Please choose your state." };

  let handle = slugifyHandle(displayName);
  if (handle.length < 3) handle = `sparky_${user.id.slice(0, 8)}`;

  // Ensure handle uniqueness by suffixing if taken.
  const { data: existing } = await supabase
    .from("profiles")
    .select("handle")
    .like("handle", `${handle}%`);
  if (existing && existing.some((p) => p.handle === handle)) {
    handle = `${handle}_${user.id.slice(0, 4)}`.slice(0, 30);
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: user.id,
    handle,
    display_name: displayName,
    real_name: realName || null,
    state,
    trade_role: tradeRole,
    years_experience: Number.isFinite(years) ? Math.max(0, Math.min(70, years)) : 0,
    specialisations,
    verification_status: licenceNumber ? "pending" : "unverified",
  });
  if (profileError) {
    return { error: "Could not create your profile. Please try again." };
  }

  if (licenceNumber) {
    await supabase.from("licence_verifications").insert({
      user_id: user.id,
      state,
      licence_number: licenceNumber,
      licence_class: licenceClass || null,
      status: "pending",
    });
  }

  redirect("/feed");
}
