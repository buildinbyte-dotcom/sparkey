"use server";

import { createClient } from "@/lib/supabase/server";

export async function savePushToken(token: string, platform: string) {
  if (platform !== "ios" && platform !== "android") return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("register_push_token", {
    p_token: token,
    p_platform: platform,
  });
  if (error) console.error("Could not save push token:", error.message);
}

export async function removePushToken(token: string) {
  const supabase = await createClient();
  await supabase.rpc("unregister_push_token", { p_token: token });
}
