"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface JourneyDayTabsProps {
  days: { day_number: number; theme: string }[];
}

/**
 * Sticky day tabs that pin to the top of the viewport once the user scrolls
 * past the journey hero. Highlights the day currently in view via
 * IntersectionObserver against #day-N anchors. Tap-to-jump scrolls the day
 * card into view with anchor offset for the sticky header.
 */
export function JourneyDayTabs({ days }: JourneyDayTabsProps) {
  const [active, setActive] = useState<number>(days[0]?.day_number ?? 1);
  const [pinned, setPinned] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const sentinel = sentinelRef.current;

    // Pin once sentinel scrolls above the viewport top.
    const pinObs = new IntersectionObserver(
      ([entry]) => setPinned(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { rootMargin: "-1px 0px 0px 0px", threshold: 0 }
    );
    pinObs.observe(sentinel);

    // Track which day is in view.
    const dayObs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          const id = (visible[0].target as HTMLElement).id;
          const m = id.match(/^day-(\d+)$/);
          if (m) setActive(parseInt(m[1], 10));
        }
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.5, 1] }
    );
    for (const d of days) {
      const el = document.getElementById(`day-${d.day_number}`);
      if (el) dayObs.observe(el);
    }

    return () => {
      pinObs.disconnect();
      dayObs.disconnect();
    };
  }, [days]);

  return (
    <>
      <div ref={sentinelRef} aria-hidden className="h-px w-full" />
      <nav
        aria-label="Days"
        className={cn(
          "z-30 border-b border-brand-gold/20 bg-brand-cream/95 backdrop-blur-md transition-shadow",
          pinned ? "sticky top-14 shadow-sm" : "relative"
        )}
      >
        <div className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
          {days.map((d) => (
            <a
              key={d.day_number}
              href={`#day-${d.day_number}`}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors",
                active === d.day_number
                  ? "bg-brand-deep-green text-brand-cream"
                  : "text-brand-deep-green/70 hover:bg-brand-gold/10"
              )}
            >
              <span className="mr-1.5">Day {d.day_number}</span>
              <span className="font-normal normal-case tracking-normal text-current/80">
                {d.theme}
              </span>
            </a>
          ))}
        </div>
      </nav>
    </>
  );
}
