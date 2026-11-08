"use client";

import { useState, useTransition } from "react";
import { Ban } from "lucide-react";
import { blockUser, unblockUser } from "@/app/(app)/u/[handle]/actions";
import { cn } from "@/lib/utils";

/**
 * Block hides a member's questions, answers and comments from you. They aren't told.
 * `blocked` switches the button to Unblock.
 */
export function BlockButton({
  userId,
  displayName,
  blocked = false,
  className,
}: {
  userId: string;
  displayName: string;
  blocked?: boolean;
  className?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function run(action: typeof blockUser) {
    startTransition(async () => {
      setError("");
      const res = await action(userId);
      if (res.error) {
        setError(res.error);
        return;
      }
      setConfirming(false);
    });
  }

  if (blocked) {
    return (
      <span className="inline-flex items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(unblockUser)}
          className={cn("btn-secondary text-xs", className)}
        >
          {pending ? "Unblocking…" : "Unblock"}
        </button>
        {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={cn(
          "flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-ink-500 transition hover:text-red-600 dark:hover:text-red-400",
          className
        )}
      >
        <Ban className="h-3.5 w-3.5" /> Block
      </button>
      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setConfirming(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm space-y-3 rounded-xl border border-ink-700 bg-ink-900 p-4 text-left shadow-xl"
          >
            <h2 className="font-semibold text-ink-50">Block {displayName}?</h2>
            <p className="text-sm text-ink-400">
              You won&apos;t see their questions, answers or comments. They won&apos;t be told.
              You can unblock them from their profile or Settings.
            </p>
            {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="btn-secondary flex-1 py-1.5 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(blockUser)}
                className="btn-danger flex-1 py-1.5 text-xs"
              >
                {pending ? "Blocking…" : "Block"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
