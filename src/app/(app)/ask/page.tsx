import { createClient } from "@/lib/supabase/server";
import { SafetyBanner } from "@/components/SafetyBanner";
import { AskForm } from "./AskForm";
import type { Tag } from "@/lib/types";

export const metadata = { title: "Ask a question" };

export default async function AskPage() {
  const supabase = await createClient();
  const { data: tags } = await supabase.from("tags").select("*").order("name");

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-bold text-white">Ask a question</h1>
      <SafetyBanner />
      <div className="rounded-lg border border-ink-800 bg-ink-900/40 p-3 text-xs text-ink-500">
        Before you upload photos: crop out faces, number plates, client addresses and anything that
        identifies a site or customer.
      </div>
      <AskForm tags={(tags ?? []) as Tag[]} aiEnabled={!!process.env.OPENAI_API_KEY} />
    </div>
  );
}
