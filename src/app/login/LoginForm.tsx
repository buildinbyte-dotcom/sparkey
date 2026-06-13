"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const RESEND_COOLDOWN = 60; // seconds, matches Supabase's per-user resend window

export function LoginForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (cooldown > 0) return;
    setStatus("loading");
    const email = String(new FormData(e.currentTarget).get("email")).trim().toLowerCase();
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
      },
    });
    if (error) {
      // Supabase rate limit errors: surface a friendly message and start cooldown
      if (
        error.message.toLowerCase().includes("rate limit") ||
        error.message.toLowerCase().includes("email rate limit") ||
        error.message.toLowerCase().includes("too many requests") ||
        error.status === 429
      ) {
        setMessage("Too many attempts — please wait 60 seconds before trying again.");
        setCooldown(RESEND_COOLDOWN);
        setStatus("error");
      } else {
        setMessage(error.message);
        setStatus("error");
      }
      return;
    }
    setStatus("sent");
    setCooldown(RESEND_COOLDOWN);
  }

  if (status === "sent") {
    return (
      <div className="space-y-3">
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          Check your email — we&apos;ve sent you a sign-in link.
        </p>
        {cooldown > 0 && (
          <p className="text-center text-xs text-zinc-500">
            Didn&apos;t receive it? You can resend in {cooldown}s.
          </p>
        )}
        {cooldown === 0 && (
          <button
            onClick={() => setStatus("idle")}
            className="w-full text-center text-xs text-zinc-400 underline underline-offset-2 hover:text-zinc-200"
          >
            Resend sign-in link
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input name="email" type="email" required placeholder="you@example.com" className="field" />
      {status === "error" && <p className="text-sm text-red-400">{message}</p>}
      <button
        type="submit"
        disabled={status === "loading" || cooldown > 0}
        className="btn-primary w-full"
      >
        {status === "loading"
          ? "Sending…"
          : cooldown > 0
            ? `Wait ${cooldown}s to resend`
            : "Email me a sign-in link"}
      </button>
    </form>
  );
}
