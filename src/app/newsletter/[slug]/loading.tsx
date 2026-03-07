import { Skeleton } from "@/components/ui/skeleton";

export default function EditionDetailLoading() {
  return (
    <div>
      <div className="bg-brand-cream px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <Skeleton className="mx-auto h-3 w-28" />
          <Skeleton className="mx-auto mt-4 h-10 w-3/4" />
          <Skeleton className="mx-auto mt-4 h-5 w-1/2" />
        </div>
      </div>
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-10 sm:px-6">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}
