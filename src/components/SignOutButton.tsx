"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({
  className = "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-ink-400 transition hover:bg-ink-900 hover:text-white",
  iconClassName = "h-4 w-4",
}: {
  className?: string;
  iconClassName?: string;
}) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button onClick={signOut} className={className}>
      <LogOut className={iconClassName} />
      Sign out
    </button>
  );
}
