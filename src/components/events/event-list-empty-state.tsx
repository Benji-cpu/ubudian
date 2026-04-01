import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EventListEmptyState() {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-cream">
        <Search className="h-7 w-7 text-brand-deep-green" />
      </div>
      <h3 className="font-serif text-xl font-medium text-foreground">
        Nothing matching those filters
      </h3>
      <p className="mt-2 max-w-sm text-muted-foreground">
        Try adjusting your filters or search, or submit your own event to share
        with the community.
      </p>
      <div className="mt-6 flex gap-3">
        <Button variant="outline" asChild>
          <Link href="/events">Clear filters</Link>
        </Button>
        <Button asChild>
          <Link href="/events/submit">Submit an Event</Link>
        </Button>
      </div>
    </div>
  );
}
