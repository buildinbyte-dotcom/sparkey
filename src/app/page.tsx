import Link from "next/link";
import { Zap, ShieldCheck, MessageSquare, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/feed");

  return (
    <main className="mx-auto max-w-5xl px-4 pb-24">
      <header className="flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-spark-400" />
          <span className="text-lg font-bold tracking-tight text-white">SparkyQ</span>
        </div>
        <Link href="/login" className="btn-secondary">
          Sign in
        </Link>
      </header>

      <section className="py-16 text-center">
        <p className="mb-4 inline-flex rounded-full border border-spark-400/30 bg-spark-400/10 px-3 py-1 text-xs font-medium text-spark-300">
          Closed beta — NSW &amp; VIC electricians first
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
          Get unstuck on site. Build a reputation that{" "}
          <span className="text-spark-400">unlocks better work.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-400">
          SparkyQ is a verified peer-help network for Australian electricians. Ask practical
          job-site questions, get answers from verified sparkies, and build category-specific
          reputation that proves what you know.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: ShieldCheck,
            title: "Verified trade only",
            body: "Every member is licence-checked against state registers. No DIY public, no tyre kickers.",
          },
          {
            icon: MessageSquare,
            title: "Real job-site answers",
            body: "Photos, fault finding, switchboards, solar, batteries, RCDs — with state context for NSW and VIC.",
          },
          {
            icon: Zap,
            title: "Ask without the ego hit",
            body: "Verified privately, post semi-pseudonymously. The community sees “Verified NSW Electrician, 8 yrs”.",
          },
          {
            icon: TrendingUp,
            title: "Reputation that matters",
            body: "Category-specific scores built from accepted answers and expert confirmations — not just activity.",
          },
        ].map((f) => (
          <div key={f.title} className="card">
            <f.icon className="mb-3 h-6 w-6 text-spark-400" />
            <h3 className="mb-1 font-semibold text-white">{f.title}</h3>
            <p className="text-sm text-ink-400">{f.body}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto mt-20 max-w-xl">
        <div className="card border-spark-400/20 text-center">
          <h2 className="mb-1 text-xl font-bold text-white">Get started</h2>
          <p className="mb-6 text-sm text-ink-400">
            Create an account or sign in with your email — no password needed. We verify your
            licence before you join the conversation.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/login" className="btn-primary w-full sm:w-auto">
              Sign up
            </Link>
            <Link href="/login" className="btn-secondary w-full sm:w-auto">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <footer className="mt-24 border-t border-ink-800 pt-8 text-center text-xs text-ink-600">
        <p>
          SparkyQ is a peer discussion platform for verified trade professionals. It does not
          provide formal electrical advice. Electrical work must be performed by appropriately
          licensed people in your state.
        </p>
      </footer>
    </main>
  );
}
