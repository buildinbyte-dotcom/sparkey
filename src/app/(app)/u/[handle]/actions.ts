"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type BlockActionResult = { error?: string };

export async function blockUser(userId: string): Promise<BlockActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };
  if (user.id === userId) return { error: "You can't block yourself." };

  const { error } = await supabase
    .from("user_blocks")
    .upsert({ blocker_id: user.id, blocked_id: userId }, { ignoreDuplicates: true });
  if (error) return { error: "Could not block this member. Please try again." };

  revalidatePath("/", "layout");
  return {};
}

export async function unblockUser(userId: string): Promise<BlockActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  const { error } = await supabase
    .from("user_blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", userId);
  if (error) return { error: "Could not unblock this member. Please try again." };

  revalidatePath("/", "layout");
  return {};
}
