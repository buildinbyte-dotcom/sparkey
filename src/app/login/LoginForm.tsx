"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const OTP_LENGTH = 6;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  // One real input holds the whole code; the six boxes only display it. Moving focus
  // between separate inputs drops keystrokes on iOS and breaks one-time-code autofill.
  const [otp, setOtp] = useState("");
  const [otpFocused, setOtpFocused] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "verifying" | "error">("idle");
  const [message, setMessage] = useState("");
  const otpInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    const normalizedEmail = email.trim().toLowerCase();
    setEmail(normalizedEmail);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        },
      });
      if (error) {
        setMessage(error.message);
        setStatus("error");
        return;
      }
      setOtp("");
      setStatus("sent");
      setTimeout(() => otpInputRef.current?.focus(), 50);
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Could not connect to authentication service."
      );
      setStatus("error");
    }
  }

  async function submitToken(token: string) {
    if (token.length < OTP_LENGTH || status === "verifying") return;
    setStatus("verifying");
    setMessage("");
    try {
      const supabase = createClient();
      let { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });
      if (error) {
        // If this is the user's first sign-in, Supabase may have issued a 'signup' OTP token
        const retry = await supabase.auth.verifyOtp({
          email,
          token,
          type: "signup",
        });
        if (!retry.error) {
          error = null;
        }
      }
      if (error) {
        setMessage(error.message);
        setStatus("sent");
        return;
      }
      const rawNext = searchParams.get("next") ?? "/feed";
      const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/feed";
      router.push(next);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not verify code.");
      setStatus("sent");
    }
  }

  function handleVerifyOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void submitToken(otp);
  }

  function handleOtpChange(value: string) {
    const code = value.replace(/\D/g, "").slice(0, OTP_LENGTH);
    setOtp(code);
    if (code.length === OTP_LENGTH) void submitToken(code);
  }

  if (status === "sent" || status === "verifying") {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm text-emerald-700 dark:text-emerald-300">
          Check <strong>{email}</strong> — tap the magic link or paste the 6-digit code below.
        </div>
        <form onSubmit={handleVerifyOtp} className="space-y-3">
          <div className="relative">
            <div className="grid grid-cols-6 gap-2" aria-hidden>
              {Array.from({ length: OTP_LENGTH }, (_, i) => {
                const active =
                  otpFocused && status !== "verifying" && i === Math.min(otp.length, OTP_LENGTH - 1);
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex h-12 items-center justify-center rounded-lg border bg-ink-900 font-mono text-lg font-bold text-ink-50 transition",
                      active ? "border-spark-400 ring-2 ring-spark-400/25" : "border-ink-700",
                      status === "verifying" && "opacity-50"
                    )}
                  >
                    {otp[i] ?? ""}
                  </div>
                );
              })}
            </div>
            {/* Transparent input over the boxes: taps, typing, paste and autofill all land here */}
            <input
              ref={otpInputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              maxLength={OTP_LENGTH}
              value={otp}
              disabled={status === "verifying"}
              aria-label="6-digit sign-in code"
              onChange={(e) => handleOtpChange(e.target.value)}
              onFocus={() => setOtpFocused(true)}
              onBlur={() => setOtpFocused(false)}
              className="absolute inset-0 h-full w-full bg-transparent text-base text-transparent caret-transparent outline-none selection:bg-transparent"
            />
          </div>
          {message && <p className="text-sm text-red-600 dark:text-red-400">{message}</p>}
          <button
            type="submit"
            disabled={status === "verifying" || otp.length < OTP_LENGTH}
            className="btn-primary w-full"
          >
            {status === "verifying" ? "Verifying…" : "Verify code & sign in"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setOtp("");
            setMessage("");
          }}
          className="w-full text-center text-xs text-ink-500 hover:text-ink-200"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        name="email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="field"
      />
      {status === "error" && <p className="text-sm text-red-600 dark:text-red-400">{message}</p>}
      <button type="submit" disabled={status === "loading"} className="btn-primary w-full">
        {status === "loading" ? "Sending…" : "Email me a sign-in link"}
      </button>
    </form>
  );
}
