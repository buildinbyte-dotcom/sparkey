import { redirect } from "next/navigation";
import { Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./OnboardingForm";

export const metadata = { title: "Set up your profile" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (profile) redirect("/feed");

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 flex items-center gap-2">
        <Zap className="h-6 w-6 text-spark-400" />
        <span className="text-lg font-bold text-white">SparkyStack</span>
      </div>
      <h1 className="text-2xl font-bold text-white">Set up your profile</h1>
      <p className="mt-2 mb-8 text-sm text-ink-400">
        Your real name and licence details stay private — the community only sees your display
        name, state, role and experience. Licence verification is checked manually by our team
        against your state&apos;s public register.
      </p>
      <OnboardingForm />
    </main>
  );
}
