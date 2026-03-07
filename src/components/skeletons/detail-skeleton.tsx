import { Skeleton } from "@/components/ui/skeleton";

export function DetailSkeleton() {
  return (
    <div>
      <Skeleton className="h-[360px] w-full" />
      <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-3 h-10 w-3/4" />
        <Skeleton className="mt-4 h-5 w-full" />
        <Skeleton className="mt-2 h-5 w-2/3" />
      </div>
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-10 sm:px-6">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}
