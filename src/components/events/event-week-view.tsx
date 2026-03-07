"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isToday,
  addWeeks,
  subWeeks,
} from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatEventTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { expandRecurrence } from "@/lib/recurrence";
import type { Event } from "@/types";

interface EventWeekViewProps {
  events: Event[];
}

export function EventWeekView({ events }: EventWeekViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const weekParam = searchParams.get("week");
  const currentWeekStart = weekParam
    ? startOfWeek(new Date(weekParam), { weekStartsOn: 1 })
    : startOfWeek(new Date(), { weekStartsOn: 1 });

  const days = useMemo(() => {
    return eachDayOfInterval({
      start: currentWeekStart,
      end: endOfWeek(currentWeekStart, { weekStartsOn: 1 }),
    });
  }, [currentWeekStart]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, Event[]> = {};
    const rangeEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });

    events.forEach((e) => {
      if (e.is_recurring && e.recurrence_rule) {
        const dates = expandRecurrence(e, currentWeekStart, rangeEnd);
        dates.forEach((d) => {
          const key = format(d, "yyyy-MM-dd");
          if (!map[key]) map[key] = [];
          map[key].push(e);
        });
      } else {
        const key = e.start_date;
        if (!map[key]) map[key] = [];
        map[key].push(e);
      }
    });
    return map;
  }, [events, currentWeekStart]);

  function navigate(direction: "prev" | "next") {
    const newWeek = direction === "prev"
      ? subWeeks(currentWeekStart, 1)
      : addWeeks(currentWeekStart, 1);
    const params = new URLSearchParams(searchParams.toString());
    params.set("week", format(newWeek, "yyyy-MM-dd"));
    params.set("view", "week");
    router.push(`/events?${params.toString()}`);
  }

  return (
    <div>
      {/* Week navigation */}
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate("prev")}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-serif text-lg font-medium">
          {format(currentWeekStart, "MMM d")} – {format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), "MMM d, yyyy")}
        </h3>
        <Button variant="ghost" size="icon" onClick={() => navigate("next")}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Week grid */}
      <div className="grid gap-3 md:grid-cols-7">
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDate[dateKey] || [];

          return (
            <div
              key={dateKey}
              className={cn(
                "min-h-[120px] rounded-md border p-3",
                isToday(day) && "border-brand-deep-green bg-brand-pale-green"
              )}
            >
              <div className="mb-2 text-center">
                <div className="text-xs font-medium text-muted-foreground">
                  {format(day, "EEE")}
                </div>
                <div className={cn(
                  "text-lg font-bold",
                  isToday(day) && "text-brand-deep-green"
                )}>
                  {format(day, "d")}
                </div>
              </div>

              <div className="space-y-2">
                {dayEvents.map((ev, idx) => (
                  <Link
                    key={`${ev.id}-${dateKey}-${idx}`}
                    href={`/events/${ev.slug}`}
                    className="block rounded bg-muted/50 p-1.5 text-xs transition-colors hover:bg-muted"
                  >
                    <span className="font-medium line-clamp-2">{ev.title}</span>
                    {ev.start_time && (
                      <span className="mt-0.5 block text-muted-foreground">
                        {formatEventTime(ev.start_time, ev.end_time)}
                      </span>
                    )}
                  </Link>
                ))}
                {dayEvents.length === 0 && (
                  <p className="text-center text-[10px] text-muted-foreground/50">
                    No events
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
