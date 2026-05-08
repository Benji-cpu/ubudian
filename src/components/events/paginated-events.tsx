"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginatedEventsProps<T> {
  items: T[];
  pageSize?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  containerClassName?: string;
  emptyState?: React.ReactNode;
  /** Custom skeleton block shown when more items are loading. */
  renderSkeleton?: () => React.ReactNode;
}

/**
 * Renders items in pages, loading the next page automatically when a
 * sentinel scrolls into view. A "Load more" button is provided as
 * a non-JavaScript-fallback / accessibility option.
 *
 * Pure render-side pagination — fetches once, paginates client-side.
 */
export function PaginatedEvents<T extends { id: string }>({
  items,
  pageSize = 24,
  renderItem,
  containerClassName,
  emptyState,
  renderSkeleton,
}: PaginatedEventsProps<T>) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const visibleItems = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount]
  );
  const hasMore = visibleCount < items.length;

  // Reset visible count whenever the underlying items list changes
  // (e.g. when filters change).
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [items, pageSize]);

  useEffect(() => {
    if (!hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisibleCount((current) =>
            Math.min(current + pageSize, items.length)
          );
        }
      },
      { rootMargin: "320px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, items.length, pageSize]);

  if (items.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div>
      <div className={containerClassName}>
        {visibleItems.map((item, idx) => renderItem(item, idx))}
      </div>

      {hasMore && (
        <>
          <div
            ref={sentinelRef}
            aria-hidden
            className="h-1 w-full"
          />
          <div className="mt-6 flex flex-col items-center gap-4">
            {renderSkeleton ? (
              <div className={cn("w-full", containerClassName)}>
                {Array.from({
                  length: Math.min(pageSize, items.length - visibleCount),
                }).map((_, i) => (
                  <div key={`skel-${i}`}>{renderSkeleton()}</div>
                ))}
              </div>
            ) : null}
            <Button
              variant="outline"
              onClick={() =>
                setVisibleCount((c) => Math.min(c + pageSize, items.length))
              }
              className="rounded-full border-brand-deep-green/20 bg-white/60 px-6 text-xs font-medium tracking-wide text-brand-deep-green shadow-sm hover:bg-white"
            >
              Show more events
              <span className="ml-2 text-brand-charcoal/50">
                · {items.length - visibleCount} remaining
              </span>
            </Button>
          </div>
        </>
      )}

      {!hasMore && items.length > pageSize && (
        <div className="mt-10 flex flex-col items-center gap-3">
          <div className="h-px w-12 bg-brand-gold/40" />
          <p className="text-xs uppercase tracking-[0.18em] text-brand-charcoal/50">
            That&apos;s all for now
          </p>
        </div>
      )}
    </div>
  );
}

/** Card-shaped skeleton matching EventGridCard dimensions. */
export function EventCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-brand-deep-green/10 bg-white/40">
      <div className="aspect-[16/10] w-full animate-pulse bg-brand-deep-green/5" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-brand-deep-green/10" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-brand-deep-green/8" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-brand-deep-green/8" />
      </div>
    </div>
  );
}

/** Row-shaped skeleton matching EventCard list dimensions. */
export function EventRowSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden rounded-xl border border-brand-deep-green/10 bg-white/40 p-3">
      <div className="aspect-square h-24 w-24 shrink-0 animate-pulse rounded-lg bg-brand-deep-green/5" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 w-3/4 animate-pulse rounded bg-brand-deep-green/10" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-brand-deep-green/8" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-brand-deep-green/8" />
      </div>
    </div>
  );
}
