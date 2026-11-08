import type { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

/** Ids of members the viewer has blocked; their content is hidden from the viewer. */
export async function getBlockedIds(supabase: ServerClient, userId: string | undefined) {
  if (!userId) return [];
  const { data } = await supabase
    .from("user_blocks")
    .select("blocked_id")
    .eq("blocker_id", userId);
  return (data ?? []).map((row) => row.blocked_id as string);
}

/** PostgREST `not.in` filter value for a list of ids. */
export function idList(ids: string[]) {
  return `(${ids.join(",")})`;
}
