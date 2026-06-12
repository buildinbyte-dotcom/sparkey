"use client";

import { useActionState } from "react";
import { AU_STATES, SPECIALISATIONS, TRADE_ROLES } from "@/lib/constants";
import { completeOnboarding, type OnboardingState } from "./actions";

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(
    completeOnboarding,
    {}
  );

  return (
    <form action={formAction} className="space-y-6">
      <div className="card space-y-4">
        <h2 className="font-semibold text-white">Public profile</h2>
        <div>
          <label className="mb-1 block text-sm text-ink-300">
            Display name <span className="text-ink-500">(real name or trade handle)</span>
          </label>
          <input name="display_name" required minLength={2} maxLength={60} className="field" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm text-ink-300">State</label>
            <select name="state" required defaultValue="" className="field">
              <option value="" disabled>
                Select
              </option>
              {AU_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-ink-300">Role</label>
            <select name="trade_role" defaultValue="electrician" className="field">
              {TRADE_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm text-ink-300">Years of experience</label>
          <input name="years_experience" type="number" min={0} max={70} defaultValue={0} className="field" />
        </div>
        <div>
          <label className="mb-2 block text-sm text-ink-300">Specialisations</label>
          <div className="flex flex-wrap gap-2">
            {SPECIALISATIONS.map((s) => (
              <label
                key={s}
                className="cursor-pointer rounded-full border border-ink-700 px-3 py-1.5 text-xs text-ink-300 transition has-checked:border-spark-400 has-checked:bg-spark-400/10 has-checked:text-spark-300"
              >
                <input type="checkbox" name="specialisations" value={s} className="sr-only" />
                {s}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold text-white">Private details</h2>
        <p className="text-xs text-ink-500">
          Only visible to you and the verification team. We store your licence number and check it
          against your state&apos;s public register — we never store copies of documents.
        </p>
        <div>
          <label className="mb-1 block text-sm text-ink-300">Full name</label>
          <input name="real_name" maxLength={100} className="field" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm text-ink-300">
              Licence number <span className="text-ink-500">(optional for apprentices)</span>
            </label>
            <input name="licence_number" maxLength={40} className="field" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-ink-300">Licence class</label>
            <input
              name="licence_class"
              maxLength={80}
              placeholder="e.g. A Grade, Qualified Supervisor"
              className="field"
            />
          </div>
        </div>
      </div>

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Creating profile…" : "Create my profile"}
      </button>
    </form>
  );
}
