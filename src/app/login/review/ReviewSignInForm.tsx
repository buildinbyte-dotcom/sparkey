"use client";

import { useActionState } from "react";
import { reviewSignIn, type ReviewSignInState } from "./actions";

export function ReviewSignInForm() {
  const [state, formAction, pending] = useActionState<ReviewSignInState, FormData>(
    reviewSignIn,
    {}
  );

  return (
    <form action={formAction} className="space-y-3">
      <input
        name="email"
        type="email"
        required
        autoComplete="username"
        placeholder="Review account email"
        className="field"
      />
      <input
        name="password"
        type="password"
        required
        autoComplete="current-password"
        placeholder="Password"
        className="field"
      />
      {state.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
