import { Skeleton } from "@/components/ui/skeleton";

export function StoryCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-sm border border-brand-gold/10 bg-card">
      <Skeleton className="aspect-[4/5] w-full" />
      <div className="p-5">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="mt-2 h-3 w-full" />
        <div className="mt-3 flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
}
