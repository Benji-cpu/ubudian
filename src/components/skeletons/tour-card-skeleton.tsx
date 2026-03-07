import { Skeleton } from "@/components/ui/skeleton";

export function TourCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-sm border border-brand-gold/10 bg-card">
      <Skeleton className="aspect-video w-full" />
      <div className="p-5">
        <Skeleton className="h-5 w-3/4" />
        <div className="mt-2 flex gap-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="mt-2 h-3 w-full" />
        <Skeleton className="mt-1.5 h-3 w-2/3" />
      </div>
    </div>
  );
}
