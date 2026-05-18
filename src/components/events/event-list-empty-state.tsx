"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { addDays, endOfWeek, format } from "date-fns";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { nowInBaliDate } from "@/lib/events/bali-time";

/**
 * Empty state with context-aware fallbacks. When a user lands here we want
 * to give them somewhere obvious to go next — clearing only the date filter
 * (if that's what's empty), widening to this week, or browsing the feed
 * view which surfaces curated rails. "Submit an event" stays as the last
 * resort.
 */
export function EventListEmptyState() {
  const searchParams = useSearchParams();
  const hasDateRange = !!(searchParams.get("from") || searchParams.get("to"));
  const hasCategory = !!searchParams.get("category");
  const hasSearch = !!searchParams.get("q");
  const hasHappening = searchParams.get("happening") === "true";

  const today = nowInBaliDate();
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  // Build a "Clear date filter" URL that drops only from/to.
  const sansDates = new URLSearchParams(searchParams.toString());
  sansDates.delete("from");
  sansDates.delete("to");
  sansDates.delete("happening");

  const thisWeekParams = new URLSearchParams(sansDates.toString());
  thisWeekParams.set("from", format(today, "yyyy-MM-dd"));
  thisWeekParams.set("to", format(weekEnd, "yyyy-MM-dd"));

  // Drop everything except view — true "clear all".
  const clearAll = new URLSearchParams();
  const view = searchParams.get("view");
  if (view) clearAll.set("view", view);

  const fallbacks: { label: string; href: string; primary?: boolean }[] = [];

  if (hasDateRange || hasHappening) {
    fallbacks.push({
      label: "Clear date filter",
      href: `/events?${sansDates.toString()}`,
      primary: true,
    });
  }

  if (!hasDateRange) {
    fallbacks.push({
      label: "Try this week",
      href: `/events?${thisWeekParams.toString()}`,
      primary: !hasCategory && !hasSearch,
    });
  }

  if (hasCategory || hasSearch || hasDateRange) {
    fallbacks.push({
      label: "Browse the feed",
      href: `/events?${clearAll.toString() ? `${clearAll.toString()}&` : ""}view=feed`,
    });
  }

  // Always offer a submission path as the last resort.
  fallbacks.push({ label: "Submit an event", href: "/events/submit" });

  return (
    <div className="flex flex-col items-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-cream">
        <Search className="h-7 w-7 text-brand-deep-green" />
      </div>
      <h3 className="font-serif text-xl font-medium text-foreground">
        Nothing matching those filters
      </h3>
      <p className="mt-2 max-w-sm text-muted-foreground">
        Try widening the window or browsing the curated feed — new gatherings
        land daily.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {fallbacks.map((fb) => (
          <Button
            key={fb.label}
            variant={fb.primary ? "default" : "outline"}
            asChild
          >
            <Link href={fb.href}>{fb.label}</Link>
          </Button>
        ))}
      </div>
    </div>
  );
}
