import { Skeleton } from "@/components/ui/skeleton";

export function PostCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-sm border border-brand-gold/10 bg-card">
      <Skeleton className="aspect-video w-full" />
      <div className="p-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-2 h-5 w-3/4" />
        <Skeleton className="mt-3 h-3 w-full" />
        <Skeleton className="mt-1.5 h-3 w-2/3" />
      </div>
    </div>
  );
}
