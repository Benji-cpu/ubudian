"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { expandRecurrence } from "@/lib/recurrence";
import type { Event } from "@/types";

interface EventCalendarProps {
  events: Event[];
}

const CATEGORY_COLORS: Record<string, string> = {
  "Music & Live Performance": "bg-brand-terracotta",
  "Yoga & Wellness": "bg-brand-sage",
  "Art & Culture": "bg-brand-gold",
  "Food & Drink": "bg-orange-400",
  "Community & Social": "bg-brand-mid-green",
  "Workshop & Class": "bg-blue-400",
  "Market & Shopping": "bg-purple-400",
  "Sports & Adventure": "bg-red-400",
  "Kids & Family": "bg-pink-400",
  "Other": "bg-gray-400",
};

export function EventCalendar({ events }: EventCalendarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const monthParam = searchParams.get("month");

  const currentMonth = useMemo(
    () => (monthParam ? new Date(`${monthParam}-01`) : new Date()),
    [monthParam]
  );

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, Event[]> = {};
    const rangeStart = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const rangeEnd = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });

    events.forEach((e) => {
      if (e.is_recurring && e.recurrence_rule) {
        const dates = expandRecurrence(e, rangeStart, rangeEnd);
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
  }, [events, currentMonth]);

  function navigate(direction: "prev" | "next") {
    const newMonth = direction === "prev"
      ? subMonths(currentMonth, 1)
      : addMonths(currentMonth, 1);
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", format(newMonth, "yyyy-MM"));
    params.set("view", "calendar");
    router.push(`/events?${params.toString()}`);
  }

  return (
    <div>
      {/* Month navigation */}
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate("prev")}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-serif text-lg font-medium">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <Button variant="ghost" size="icon" onClick={() => navigate("next")}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px text-center text-xs font-medium text-muted-foreground">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="py-2">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px">
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDate[dateKey] || [];
          const inMonth = isSameMonth(day, currentMonth);

          return (
            <div
              key={dateKey}
              className={cn(
                "min-h-[80px] border border-border/50 p-1",
                !inMonth && "bg-muted/30",
                isToday(day) && "bg-brand-pale-green"
              )}
            >
              <span
                className={cn(
                  "text-xs",
                  !inMonth && "text-muted-foreground/50",
                  isToday(day) && "font-bold text-brand-deep-green"
                )}
              >
                {format(day, "d")}
              </span>
              <div className="mt-0.5 space-y-0.5">
                {dayEvents.slice(0, 3).map((ev, idx) => (
                  <div
                    key={`${ev.id}-${dateKey}-${idx}`}
                    className="flex items-center gap-1 truncate text-[10px] leading-tight"
                    title={ev.title}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 shrink-0 rounded-full",
                        CATEGORY_COLORS[ev.category] || "bg-gray-400"
                      )}
                    />
                    <span className="truncate">{ev.title}</span>
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{dayEvents.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
