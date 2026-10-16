"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AU_STATES, TRADE_ROLES } from "@/lib/constants";

export type SettingsActionState = {
  error?: string;
  success?: string;
};

export async function updateProfile(
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  const displayName = String(formData.get("display_name") ?? "").trim();
  const realName = String(formData.get("real_name") ?? "").trim();
  const state = String(formData.get("state") ?? "");
  const tradeRole = String(formData.get("trade_role") ?? "electrician");
  const years = Number(formData.get("years_experience") ?? 0);
  const bio = String(formData.get("bio") ?? "").trim();
  const specialisations = formData.getAll("specialisations").map(String);

  if (displayName.length < 2 || displayName.length > 60) {
    return { error: "Display name must be between 2 and 60 characters." };
  }
  if (!AU_STATES.includes(state as (typeof AU_STATES)[number])) {
    return { error: "Please select a valid Australian state or territory." };
  }
  if (!TRADE_ROLES.some((r) => r.value === tradeRole)) {
    return { error: "Please select a valid trade role." };
  }
  if (bio.length > 500) {
    return { error: "Bio must be 500 characters or fewer." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      real_name: realName || null,
      state,
      trade_role: tradeRole,
      years_experience: Number.isFinite(years) ? Math.max(0, Math.min(70, years)) : 0,
      bio: bio || null,
      specialisations,
    })
    .eq("id", user.id);

  if (error) {
    return { error: "Could not save profile changes. Please try again." };
  }

  revalidatePath("/settings");
  revalidatePath("/feed");
  return { success: "Profile updated." };
}

export async function submitLicence(
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  const state = String(formData.get("state") ?? "");
  const licenceNumber = String(formData.get("licence_number") ?? "").trim();
  const licenceClass = String(formData.get("licence_class") ?? "").trim();

  if (!AU_STATES.includes(state as (typeof AU_STATES)[number])) {
    return { error: "Please select the state that issued your licence." };
  }
  if (licenceNumber.length < 3 || licenceNumber.length > 40) {
    return { error: "Please enter a valid licence number." };
  }

  // Avoid duplicate pending submissions
  const { data: existingPending } = await supabase
    .from("licence_verifications")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  if (existingPending) {
    return { error: "You already have a licence verification pending review." };
  }

  const { error: insertErr } = await supabase.from("licence_verifications").insert({
    user_id: user.id,
    state,
    licence_number: licenceNumber,
    licence_class: licenceClass || null,
    status: "pending",
  });

  if (insertErr) {
    return { error: "Could not submit licence details. Please try again." };
  }

  // Transition unverified or rejected profiles to pending
  const { data: profile } = await supabase
    .from("profiles")
    .select("verification_status")
    .eq("id", user.id)
    .maybeSingle();

  if (profile && (profile.verification_status === "unverified" || profile.verification_status === "rejected")) {
    await supabase
      .from("profiles")
      .update({ verification_status: "pending" })
      .eq("id", user.id);
  }

  revalidatePath("/settings");
  return { success: "Licence submitted for verification." };
}
