import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, Camera, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata = { title: "Welcome" };

// Start screen for the iOS/Android app (the website keeps the marketing landing page)
export default async function WelcomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/feed");

  return (
    <main className="mx-auto flex min-h-app max-w-md flex-col px-6 pt-2 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <div className="flex justify-end">
        <ThemeToggle />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        {/* Same mark as the app icon */}
        <div className="flex h-24 w-24 items-center justify-center rounded-[1.75rem] bg-slate-900 shadow-lg shadow-amber-500/20 ring-1 ring-white/10">
          <svg viewBox="0 0 512 512" className="h-16 w-16" aria-hidden>
            <path d="M296 64 144 288h88l-32 160 168-240h-92l20-144z" fill="#fbbf24" />
          </svg>
        </div>

        <h1 className="mt-6 text-4xl font-bold tracking-tight text-ink-50">SparkyQ</h1>
        <p className="mt-2 text-lg font-medium text-ink-200">
          Get unstuck on site.
        </p>
        <p className="mt-1 text-sm text-ink-400">
          Verified peer help for Australian electricians.
        </p>

        <ul className="mt-10 w-full space-y-3 text-left text-sm text-ink-300">
          {[
            { icon: BadgeCheck, text: "Licence-verified sparkies only" },
            { icon: Camera, text: "Snap the job, get practical answers" },
            { icon: TrendingUp, text: "Build a reputation that wins work" },
          ].map((item) => (
            <li
              key={item.text}
              className="flex items-center gap-3 rounded-xl border border-ink-800 bg-ink-900/60 px-4 py-3"
            >
              <item.icon className="h-5 w-5 shrink-0 text-spark-400" />
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10 space-y-3">
        <Link href="/login" className="btn-primary w-full py-3.5 text-base">
          Get started
        </Link>
        <Link href="/login" className="btn-secondary w-full py-3.5 text-base">
          I already have an account
        </Link>
        <p className="pt-2 text-center text-[11px] leading-relaxed text-ink-600">
          Closed beta for NSW &amp; VIC electricians. Peer discussion only — not formal
          electrical advice.
        </p>
        <nav className="flex justify-center gap-4 text-[11px] text-ink-500">
          <Link href="/privacy" className="hover:text-ink-200">
            Privacy
          </Link>
          <Link href="/support" className="hover:text-ink-200">
            Support
          </Link>
        </nav>
      </div>
    </main>
  );
}
