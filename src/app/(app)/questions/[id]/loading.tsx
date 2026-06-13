import { Skeleton } from "@/components/Skeleton";

export default function QuestionLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Skeleton className="h-16 w-full" />
      <div className="card">
        <div className="mb-3 flex flex-wrap gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-14" />
        </div>
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-1.5 h-4 w-full" />
        <Skeleton className="mt-1.5 h-4 w-2/3" />
        <div className="mt-4 flex items-center justify-between border-t border-ink-800 pt-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Skeleton className="h-5 w-24" />
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="card">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="mt-1.5 h-4 w-5/6" />
          <div className="mt-4 flex items-center justify-between border-t border-ink-800 pt-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
