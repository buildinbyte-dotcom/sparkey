"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AU_STATES, TRADE_ROLES } from "@/lib/constants";

export function WaitlistForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const form = new FormData(e.currentTarget);
    const supabase = createClient();
    const { error } = await supabase.from("waitlist").insert({
      email: String(form.get("email")).trim().toLowerCase(),
      state: form.get("state") || null,
      trade_role: form.get("trade_role") || null,
      licence_status: form.get("licence_status") || null,
      specialisation: form.get("specialisation") || null,
    });
    if (error) {
      if (error.code === "23505") {
        setStatus("done"); // already on the list
      } else {
        setError("Something went wrong — please try again.");
        setStatus("error");
      }
      return;
    }
    setStatus("done");
  }

  if (status === "done") {
    return (
      <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
        You&apos;re on the list. We&apos;ll email you when your batch opens up.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        name="email"
        type="email"
        required
        placeholder="you@example.com"
        className="field"
      />
      <div className="grid grid-cols-2 gap-3">
        <select name="state" className="field" defaultValue="">
          <option value="" disabled>
            State
          </option>
          {AU_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select name="trade_role" className="field" defaultValue="">
          <option value="" disabled>
            Role
          </option>
          {TRADE_ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
      <input
        name="specialisation"
        type="text"
        placeholder="Specialisation (e.g. solar, switchboards) — optional"
        className="field"
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button type="submit" disabled={status === "loading"} className="btn-primary w-full">
        {status === "loading" ? "Joining…" : "Join the waitlist"}
      </button>
    </form>
  );
}
