"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const OTP_LENGTH = 6;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "verifying" | "error">("idle");
  const [message, setMessage] = useState("");
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const otp = digits.join("");

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
      setDigits(Array(OTP_LENGTH).fill(""));
      setStatus("sent");
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
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

  function fillFromString(raw: string, startIndex = 0) {
    const cleaned = raw.replace(/\D/g, "");
    if (!cleaned) return;
    const next = [...digits];
    let lastFilled = startIndex;
    for (let i = 0; i < cleaned.length && startIndex + i < OTP_LENGTH; i++) {
      next[startIndex + i] = cleaned[i];
      lastFilled = startIndex + i;
    }
    setDigits(next);
    const focusIndex = Math.min(lastFilled + 1, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();

    const joined = next.join("");
    if (joined.length === OTP_LENGTH && next.every((d) => d.length === 1)) {
      void submitToken(joined);
    }
  }

  function handleDigitChange(index: number, value: string) {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length > 1) {
      // Handles multi-digit mobile autofill or quick paste into a single box
      fillFromString(cleaned, index);
      return;
    }
    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);

    if (cleaned && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    const joined = next.join("");
    if (joined.length === OTP_LENGTH && next.every((d) => d.length === 1)) {
      void submitToken(joined);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const next = [...digits];
        next[index] = "";
        setDigits(next);
      } else if (index > 0) {
        const next = [...digits];
        next[index - 1] = "";
        setDigits(next);
        inputRefs.current[index - 1]?.focus();
      }
      e.preventDefault();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
      e.preventDefault();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
      e.preventDefault();
    }
  }

  function handlePaste(index: number, e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    const cleaned = pasted.replace(/\D/g, "");
    fillFromString(cleaned, cleaned.length >= OTP_LENGTH ? 0 : index);
  }

  if (status === "sent" || status === "verifying") {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm text-emerald-700 dark:text-emerald-300">
          Check <strong>{email}</strong> — tap the magic link or paste the 6-digit code below.
        </div>
        <form onSubmit={handleVerifyOtp} className="space-y-3">
          <div className="grid grid-cols-6 gap-2">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                maxLength={OTP_LENGTH}
                value={digit}
                disabled={status === "verifying"}
                aria-label={`Digit ${i + 1} of ${OTP_LENGTH}`}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={(e) => handlePaste(i, e)}
                onFocus={(e) => e.target.select()}
                className="h-12 w-full rounded-lg border border-ink-700 bg-ink-900 text-center font-mono text-lg font-bold text-ink-50 transition focus:border-spark-400 focus:ring-2 focus:ring-spark-400/25 focus:outline-none disabled:opacity-50"
              />
            ))}
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
            setDigits(Array(OTP_LENGTH).fill(""));
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
