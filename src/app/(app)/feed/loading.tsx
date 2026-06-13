import { QuestionCardSkeleton, Skeleton } from "@/components/Skeleton";

export default function FeedLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-16 w-full" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-10 w-20" />
      </div>
      <Skeleton className="h-11 w-full" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <QuestionCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
