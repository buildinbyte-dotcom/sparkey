"use client";

import { useTransition } from "react";
import { resolveFlag, reviewLicence } from "./actions";

export function LicenceActions({ verificationId }: { verificationId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex gap-2">
      <button
        disabled={pending}
        onClick={() => startTransition(() => reviewLicence(verificationId, true))}
        className="rounded-lg border border-emerald-500/40 px-3 py-1.5 text-xs text-emerald-300 transition hover:bg-emerald-500/10 disabled:opacity-50"
      >
        Approve
      </button>
      <button
        disabled={pending}
        onClick={() => startTransition(() => reviewLicence(verificationId, false))}
        className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  );
}

export function FlagActions({ flagId, isUnsafe }: { flagId: string; isUnsafe: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-wrap gap-2">
      <button
        disabled={pending}
        onClick={() => startTransition(() => resolveFlag(flagId, true, isUnsafe ? 25 : 10))}
        className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
      >
        Uphold {isUnsafe && "(−25 rep, remove)"}
      </button>
      {isUnsafe && (
        <button
          disabled={pending}
          onClick={() => startTransition(() => resolveFlag(flagId, true, 100))}
          className="rounded-lg border border-red-500/60 bg-red-500/10 px-3 py-1.5 text-xs text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
        >
          Uphold severe (−100)
        </button>
      )}
      <button
        disabled={pending}
        onClick={() => startTransition(() => resolveFlag(flagId, false))}
        className="rounded-lg border border-ink-600 px-3 py-1.5 text-xs text-ink-300 transition hover:bg-ink-800 disabled:opacity-50"
      >
        Dismiss
      </button>
    </div>
  );
}
