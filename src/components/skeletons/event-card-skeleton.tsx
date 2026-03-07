import { Skeleton } from "@/components/ui/skeleton";

export function EventCardSkeleton() {
  return (
    <div className="flex gap-4 rounded-sm border border-brand-gold/10 bg-card p-4">
      <Skeleton className="h-14 w-14 shrink-0 rounded" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-5 w-3/4" />
        <div className="mt-2 flex gap-2">
          <Skeleton className="h-4 w-20 rounded-full" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
}
