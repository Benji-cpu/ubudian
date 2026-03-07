import { Skeleton } from "@/components/ui/skeleton";

export function EditionCardSkeleton() {
  return (
    <div className="rounded-sm border border-brand-gold/10 bg-card p-6">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-5 w-3/4" />
      <Skeleton className="mt-3 h-3 w-full" />
      <Skeleton className="mt-1.5 h-3 w-1/2" />
    </div>
  );
}
