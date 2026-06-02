"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  parseISO,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { expandRecurrence } from "@/lib/recurrence";
import type { Event } from "@/types";
import { EventCard } from "./event-card";

interface EventCalendarProps {
  events: Event[];
}

// Brand-toned dots, keyed to the real EVENT_CATEGORIES. Literal hex / brand
// tokens only (no neutral grays or utility brights) so they read in both themes.
const CATEGORY_COLORS: Record<string, string> = {
  "Dance & Movement": "bg-brand-terracotta",
  "Tantra & Intimacy": "bg-brand-gold",
  "Ceremony & Sound": "bg-brand-mid-green",
  "Yoga & Meditation": "bg-brand-sage",
  "Healing & Bodywork": "bg-[#7C9A92]",
  "Circle & Community": "bg-[#5A8A70]",
  "Music & Performance": "bg-[#C77F5A]",
  "Art & Culture": "bg-[#B59B6A]",
  "Food & Makers": "bg-[#9C6B4A]",
  "Retreat & Training": "bg-[#4F7A66]",
  "Other": "bg-brand-deep-green/40",
};

export function EventCalendar({ events }: EventCalendarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const monthParam = searchParams.get("month");

  // The "yyyy-MM-dd" key of the day whose events are zoomed into, or null (closed).
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

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

  // The selected day's events, sorted into a top-to-bottom agenda by start time
  // (untimed events fall to the bottom).
  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return [];
    return [...(eventsByDate[selectedDay] ?? [])].sort((a, b) => {
      if (!a.start_time && !b.start_time) return 0;
      if (!a.start_time) return 1;
      if (!b.start_time) return -1;
      return a.start_time.localeCompare(b.start_time);
    });
  }, [selectedDay, eventsByDate]);

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
          const hasEvents = dayEvents.length > 0;

          const cellClassName = cn(
            "min-h-[80px] border border-border/50 p-1 text-left",
            !inMonth && "bg-muted/30",
            isToday(day) && "bg-brand-pale-green",
            hasEvents &&
              "w-full cursor-pointer transition-colors hover:bg-brand-pale-green/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-inset"
          );

          const cellContent = (
            <>
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
                        CATEGORY_COLORS[ev.category] || "bg-brand-deep-green/40"
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
            </>
          );

          // Days with events become buttons that zoom into a single-day list;
          // empty days stay inert (nothing to open).
          return hasEvents ? (
            <button
              key={dateKey}
              type="button"
              onClick={() => setSelectedDay(dateKey)}
              aria-label={`View ${dayEvents.length} ${
                dayEvents.length === 1 ? "event" : "events"
              } on ${format(day, "d MMMM")}`}
              className={cellClassName}
            >
              {cellContent}
            </button>
          ) : (
            <div key={dateKey} className={cellClassName}>
              {cellContent}
            </div>
          );
        })}
      </div>

      {/* Single-day zoom: click a populated day to see its full list of events. */}
      <Dialog
        open={selectedDay !== null}
        onOpenChange={(open) => !open && setSelectedDay(null)}
      >
        <DialogContent className="max-h-[85vh] gap-0 overflow-hidden p-0 sm:max-w-xl">
          {selectedDay && (
            <>
              <DialogHeader className="border-b border-border/60 px-6 py-4 text-left">
                <DialogTitle className="font-serif text-xl font-medium text-brand-deep-green dark:text-brand-gold">
                  {format(parseISO(selectedDay), "EEEE, d MMMM")}
                </DialogTitle>
                <DialogDescription>
                  {selectedDayEvents.length}{" "}
                  {selectedDayEvents.length === 1 ? "gathering" : "gatherings"}
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[70vh] space-y-3 overflow-y-auto px-6 py-4">
                {selectedDayEvents.map((ev) => (
                  <EventCard key={ev.id} event={ev} hideDate />
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
