import { cn } from "@/lib/utils";

/** Animated placeholder block used while server content streams in. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-ink-800/70", className)} />;
}

/** Placeholder that mirrors a QuestionCard so the feed doesn't jump on load. */
export function QuestionCardSkeleton() {
  return (
    <div className="card">
      <div className="mb-3 flex flex-wrap gap-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-14" />
      </div>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-1.5 h-4 w-2/3" />
      <div className="mt-4 flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}
