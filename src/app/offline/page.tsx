"use client";

import Link from "next/link";
import { WifiOff, RefreshCw, Zap } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-6 flex items-center gap-2">
        <Zap className="h-6 w-6 text-spark-400" />
        <span className="text-lg font-bold text-ink-50">SparkyQ</span>
      </div>
      <div className="card w-full space-y-4">
        <WifiOff className="mx-auto h-10 w-10 text-spark-400" />
        <h1 className="text-lg font-bold text-ink-50">No signal right now</h1>
        <p className="text-sm text-ink-400">
          Looks like you&apos;re in a switchroom, basement, or dead zone with no mobile data.
          Reconnect to load the latest job-site questions.
        </p>
        <div className="flex flex-col gap-2 pt-2 sm:flex-row">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-primary flex-1"
          >
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
          <Link href="/feed" className="btn-secondary flex-1">
            Back to feed
          </Link>
        </div>
      </div>
    </main>
  );
}
