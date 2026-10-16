"use client";

import { useActionState, useState } from "react";
import { AU_STATES, SPECIALISATIONS, TRADE_ROLES } from "@/lib/constants";
import type { Profile } from "@/lib/types";
import { updateProfile, submitLicence, type SettingsActionState } from "./actions";

export function ProfileEditForm({ profile }: { profile: Profile }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState<SettingsActionState, FormData>(
    updateProfile,
    {}
  );

  if (!editing) {
    return (
      <div className="pt-2">
        {state.success && (
          <p className="mb-2 text-xs text-emerald-600 dark:text-emerald-400">{state.success}</p>
        )}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="btn-secondary text-xs"
        >
          Edit profile details
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-3 space-y-4 border-t border-ink-800 pt-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-ink-300">Display name (public)</label>
          <input
            name="display_name"
            required
            minLength={2}
            maxLength={60}
            defaultValue={profile.display_name}
            className="field text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-ink-300">Full name (private)</label>
          <input
            name="real_name"
            maxLength={100}
            defaultValue={profile.real_name ?? ""}
            className="field text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-xs text-ink-300">State</label>
          <select name="state" defaultValue={profile.state} className="field text-sm">
            {AU_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-ink-300">Role</label>
          <select name="trade_role" defaultValue={profile.trade_role} className="field text-sm">
            {TRADE_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-ink-300">Experience (yrs)</label>
          <input
            name="years_experience"
            type="number"
            min={0}
            max={70}
            defaultValue={profile.years_experience}
            className="field text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-ink-300">Bio (optional)</label>
        <textarea
          name="bio"
          rows={3}
          maxLength={500}
          defaultValue={profile.bio ?? ""}
          placeholder="Short note on the work you do, e.g. Commercial & solar installs across SEQ."
          className="field text-sm"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs text-ink-300">Specialisations</label>
        <div className="flex flex-wrap gap-1.5">
          {SPECIALISATIONS.map((s) => (
            <label
              key={s}
              className="cursor-pointer rounded-full border border-ink-700 px-3 py-1 text-xs text-ink-300 transition has-checked:border-spark-400 has-checked:bg-spark-400/10 has-checked:text-spark-300"
            >
              <input
                type="checkbox"
                name="specialisations"
                value={s}
                defaultChecked={(profile.specialisations ?? []).includes(s)}
                className="sr-only"
              />
              {s}
            </label>
          ))}
        </div>
      </div>

      {state.error && <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>}
      {state.success && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400">{state.success}</p>
      )}

      <div className="flex items-center gap-2">
        <button type="submit" disabled={pending} className="btn-primary text-xs">
          {pending ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="btn-secondary text-xs"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function LicenceSubmitForm({ defaultState }: { defaultState: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<SettingsActionState, FormData>(
    submitLicence,
    {}
  );

  if (state.success) {
    return (
      <p className="text-xs text-emerald-600 dark:text-emerald-400">{state.success}</p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-primary text-xs"
      >
        Submit licence for verification
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-ink-800 bg-ink-950 p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs text-ink-300">State</label>
          <select name="state" defaultValue={defaultState} className="field text-sm">
            {AU_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-ink-300">Licence number</label>
          <input
            name="licence_number"
            required
            minLength={3}
            maxLength={40}
            placeholder="e.g. PGE123456"
            className="field text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-ink-300">Licence class</label>
          <input
            name="licence_class"
            maxLength={80}
            placeholder="e.g. A Grade, Supervisor"
            className="field text-sm"
          />
        </div>
      </div>

      {state.error && <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>}

      <div className="flex items-center gap-2">
        <button type="submit" disabled={pending} className="btn-primary text-xs">
          {pending ? "Submitting…" : "Submit licence"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn-secondary text-xs"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
