"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  format,
  addDays,
  endOfWeek,
  endOfMonth,
  isFriday,
  nextFriday,
  nextSunday,
} from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { EVENT_CATEGORIES, CATEGORY_EMOJI } from "@/lib/constants";
import { PRICE_BRACKETS } from "@/lib/price-parser";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  SlidersHorizontal,
  X,
} from "lucide-react";

type DateFilter = { key: string; label: string; from: string; to: string };

function buildDateFilters(): DateFilter[] {
  const today = new Date();
  const tomorrow = addDays(today, 1);
  return [
    {
      key: "today",
      label: "Today",
      from: format(today, "yyyy-MM-dd"),
      to: format(today, "yyyy-MM-dd"),
    },
    {
      key: "tomorrow",
      label: "Tomorrow",
      from: format(tomorrow, "yyyy-MM-dd"),
      to: format(tomorrow, "yyyy-MM-dd"),
    },
    {
      key: "weekend",
      label: "This Weekend",
      from: format(
        isFriday(today) ? today : nextFriday(today),
        "yyyy-MM-dd"
      ),
      to: format(nextSunday(today), "yyyy-MM-dd"),
    },
    {
      key: "week",
      label: "This Week",
      from: format(today, "yyyy-MM-dd"),
      to: format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    },
    {
      key: "month",
      label: "This Month",
      from: format(today, "yyyy-MM-dd"),
      to: format(endOfMonth(today), "yyyy-MM-dd"),
    },
  ];
}

const TIME_OPTIONS = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
] as const;

export function EventFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category");
  const activeFrom = searchParams.get("from");
  const activeTo = searchParams.get("to");
  const activeTime = searchParams.get("time");
  const activePrice = searchParams.get("price");
  const activeVenue = searchParams.get("venue");
  const activeHappening = searchParams.get("happening") === "true";
  const activeFreeOnly = searchParams.get("free") === "true";

  const [dateFilters, setDateFilters] = useState<DateFilter[]>([]);
  const [categoryExpanded, setCategoryExpanded] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [venueInput, setVenueInput] = useState(activeVenue || "");
  const isUserTyping = useRef(false);

  useEffect(() => {
    setDateFilters(buildDateFilters());
  }, []);

  // Debounced venue search
  useEffect(() => {
    if (!isUserTyping.current) return;
    const timeout = setTimeout(() => {
      isUserTyping.current = false;
      const params = new URLSearchParams(searchParams.toString());
      if (venueInput) {
        params.set("venue", venueInput);
      } else {
        params.delete("venue");
      }
      router.push(`/events?${params.toString()}`);
    }, 300);
    return () => clearTimeout(timeout);
  }, [venueInput]); // eslint-disable-line react-hooks/exhaustive-deps

  function setParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`/events?${params.toString()}`);
  }

  function setCategory(cat: string | null) {
    setParams({ category: cat });
  }

  function toggleHappeningNow() {
    if (activeHappening) {
      setParams({ happening: null });
    } else {
      setParams({ happening: "true", from: null, to: null });
    }
  }

  function toggleDateFilter(df: DateFilter) {
    const isActive = activeFrom === df.from && activeTo === df.to;
    if (isActive) {
      setParams({ from: null, to: null });
    } else {
      setParams({ from: df.from, to: df.to, happening: null });
    }
  }

  function toggleTime(value: string) {
    setParams({ time: activeTime === value ? null : value });
  }

  function togglePrice(value: string) {
    setParams({ price: activePrice === value ? null : value });
  }

  function toggleFreeOnly() {
    setParams({ free: activeFreeOnly ? null : "true" });
  }

  // Number of filters living in the All-filters drawer
  const drawerFilterCount =
    (activeTime ? 1 : 0) +
    (activePrice ? 1 : 0) +
    (activeVenue ? 1 : 0) +
    (activeHappening ? 1 : 0);

  // Active filter pills (for the strip at the bottom)
  const activePills: { label: string; onClear: () => void }[] = [];
  if (activeHappening) {
    activePills.push({
      label: "Happening now",
      onClear: () => setParams({ happening: null }),
    });
  }
  if (activeFrom && activeTo) {
    const matched = dateFilters.find(
      (df) => df.from === activeFrom && df.to === activeTo
    );
    if (matched) {
      activePills.push({
        label: matched.label,
        onClear: () => setParams({ from: null, to: null }),
      });
    }
  }
  if (activeFreeOnly) {
    activePills.push({
      label: "Free only",
      onClear: () => setParams({ free: null }),
    });
  }
  if (activeTime) {
    const label =
      TIME_OPTIONS.find((t) => t.value === activeTime)?.label || activeTime;
    activePills.push({ label, onClear: () => setParams({ time: null }) });
  }
  if (activePrice) {
    const label =
      PRICE_BRACKETS.find((b) => b.value === activePrice)?.label || activePrice;
    activePills.push({ label, onClear: () => setParams({ price: null }) });
  }
  if (activeVenue) {
    activePills.push({
      label: `“${activeVenue}”`,
      onClear: () => {
        setVenueInput("");
        isUserTyping.current = false;
        setParams({ venue: null });
      },
    });
  }
  if (activeCategory) {
    activePills.push({
      label: `${CATEGORY_EMOJI[activeCategory] || ""} ${activeCategory}`.trim(),
      onClear: () => setCategory(null),
    });
  }

  function clearAll() {
    setVenueInput("");
    isUserTyping.current = false;
    setParams({
      time: null,
      price: null,
      venue: null,
      free: null,
      from: null,
      to: null,
      happening: null,
      category: null,
    });
  }

  // Quick-pill filters: Today / Tomorrow / Weekend / Week + Free
  const quickDates = dateFilters.filter((df) => df.key !== "month");

  return (
    <div className="space-y-4">
      {/* Row 1: Quick filters + All filters trigger */}
      <div className="flex flex-wrap items-center gap-2">
        {quickDates.map((df) => {
          const isActive = activeFrom === df.from && activeTo === df.to;
          return (
            <Button
              key={df.key}
              variant="outline"
              size="sm"
              onClick={() => toggleDateFilter(df)}
              aria-pressed={isActive}
              className={cn(
                "h-9 rounded-full border-brand-deep-green/15 bg-white/60 px-4 text-xs font-medium tracking-wide text-brand-charcoal/70 shadow-sm backdrop-blur-sm transition-all duration-200",
                "hover:border-brand-deep-green/30 hover:bg-white hover:text-brand-deep-green",
                isActive &&
                  "border-brand-deep-green bg-brand-deep-green text-brand-cream shadow-md hover:bg-brand-deep-green hover:text-brand-cream"
              )}
            >
              {df.label}
            </Button>
          );
        })}

        <Button
          variant="outline"
          size="sm"
          onClick={toggleFreeOnly}
          aria-pressed={activeFreeOnly}
          className={cn(
            "h-9 rounded-full border-brand-deep-green/15 bg-white/60 px-4 text-xs font-medium tracking-wide text-brand-charcoal/70 shadow-sm backdrop-blur-sm transition-all duration-200",
            "hover:border-brand-deep-green/30 hover:bg-white hover:text-brand-deep-green",
            activeFreeOnly &&
              "border-brand-gold bg-brand-gold text-brand-deep-green shadow-md hover:bg-brand-gold hover:text-brand-deep-green"
          )}
        >
          Free
        </Button>

        <span className="ml-1 hidden h-5 w-px bg-brand-deep-green/15 sm:block" />

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 rounded-full border-brand-deep-green/15 bg-white/60 px-4 text-xs font-medium tracking-wide text-brand-charcoal/80 shadow-sm backdrop-blur-sm transition-all duration-200",
                "hover:border-brand-deep-green/30 hover:bg-white hover:text-brand-deep-green",
                drawerFilterCount > 0 &&
                  "border-brand-deep-green/40 text-brand-deep-green"
              )}
            >
              <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
              All filters
              {drawerFilterCount > 0 && (
                <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-deep-green px-1.5 text-[10px] font-semibold text-brand-cream">
                  {drawerFilterCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-full sm:max-w-md overflow-y-auto bg-brand-cream"
          >
            <SheetHeader>
              <SheetTitle className="font-serif text-2xl text-brand-deep-green">
                Refine
              </SheetTitle>
              <SheetDescription className="text-brand-charcoal/70">
                Narrow events by time, price, venue, or what&apos;s on right
                now.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-7 px-4 py-6">
              {/* Happening now */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand-deep-green/70">
                  Right now
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleHappeningNow}
                  aria-pressed={activeHappening}
                  className={cn(
                    "h-9 rounded-full border-brand-deep-green/15 px-4 text-xs font-medium",
                    activeHappening &&
                      "border-brand-terracotta bg-brand-terracotta text-white hover:bg-brand-terracotta hover:text-white"
                  )}
                >
                  <span className="relative mr-2 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-terracotta/60 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-terracotta" />
                  </span>
                  Happening now
                </Button>
              </div>

              {/* Date range */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand-deep-green/70">
                  When
                </h3>
                <div className="flex flex-wrap gap-2">
                  {dateFilters.map((df) => {
                    const isActive =
                      activeFrom === df.from && activeTo === df.to;
                    return (
                      <Button
                        key={df.key}
                        variant="outline"
                        size="sm"
                        onClick={() => toggleDateFilter(df)}
                        className={cn(
                          "h-9 rounded-full border-brand-deep-green/15 px-4 text-xs",
                          isActive &&
                            "border-brand-deep-green bg-brand-deep-green text-brand-cream hover:bg-brand-deep-green hover:text-brand-cream"
                        )}
                      >
                        {df.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Time of day */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand-deep-green/70">
                  Time of day
                </h3>
                <div className="flex flex-wrap gap-2">
                  {TIME_OPTIONS.map((opt) => (
                    <Button
                      key={opt.value}
                      variant="outline"
                      size="sm"
                      onClick={() => toggleTime(opt.value)}
                      className={cn(
                        "h-9 rounded-full border-brand-deep-green/15 px-4 text-xs",
                        activeTime === opt.value &&
                          "border-brand-deep-green bg-brand-deep-green text-brand-cream hover:bg-brand-deep-green hover:text-brand-cream"
                      )}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand-deep-green/70">
                  Price
                </h3>
                <div className="flex flex-wrap gap-2">
                  {PRICE_BRACKETS.map((bracket) => (
                    <Button
                      key={bracket.value}
                      variant="outline"
                      size="sm"
                      onClick={() => togglePrice(bracket.value)}
                      className={cn(
                        "h-9 rounded-full border-brand-deep-green/15 px-4 text-xs",
                        activePrice === bracket.value &&
                          "border-brand-deep-green bg-brand-deep-green text-brand-cream hover:bg-brand-deep-green hover:text-brand-cream"
                      )}
                    >
                      {bracket.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Venue */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand-deep-green/70">
                  Venue
                </h3>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-deep-green/50" />
                  <Input
                    type="search"
                    placeholder="Search by venue name…"
                    value={venueInput}
                    onChange={(e) => {
                      isUserTyping.current = true;
                      setVenueInput(e.target.value);
                    }}
                    className="h-10 border-brand-deep-green/15 bg-white/80 pl-9 text-sm"
                  />
                </div>
              </div>
            </div>

            <SheetFooter className="border-t border-brand-deep-green/10 bg-white/60 backdrop-blur-sm">
              <Button
                variant="ghost"
                onClick={clearAll}
                className="text-brand-charcoal/70 hover:text-brand-deep-green"
              >
                Clear all
              </Button>
              <SheetClose asChild>
                <Button className="bg-brand-deep-green text-brand-cream hover:bg-brand-deep-green/90">
                  Show events
                </Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* Row 2: Categories */}
      <div className="relative">
        <div
          className={cn(
            "flex flex-wrap gap-2 transition-all",
            !categoryExpanded && "max-h-[36px] overflow-hidden"
          )}
        >
          <Badge
            variant={!activeCategory ? "default" : "outline"}
            className={cn(
              "shrink-0 cursor-pointer select-none rounded-full px-3.5 py-1.5 text-xs font-medium tracking-wide transition-all",
              !activeCategory
                ? "border-transparent bg-brand-deep-green text-brand-cream hover:bg-brand-deep-green/90"
                : "border-brand-deep-green/15 bg-transparent text-brand-charcoal/70 hover:border-brand-deep-green/40 hover:text-brand-deep-green"
            )}
            onClick={() => setCategory(null)}
          >
            All
          </Badge>
          {EVENT_CATEGORIES.map((cat) => {
            const emoji = CATEGORY_EMOJI[cat] || "";
            const isActive = activeCategory === cat;
            return (
              <Badge
                key={cat}
                variant={isActive ? "default" : "outline"}
                className={cn(
                  "shrink-0 cursor-pointer select-none whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium tracking-wide transition-all",
                  isActive
                    ? "border-transparent bg-brand-deep-green text-brand-cream hover:bg-brand-deep-green/90"
                    : "border-brand-deep-green/15 bg-transparent text-brand-charcoal/70 hover:border-brand-deep-green/40 hover:text-brand-deep-green"
                )}
                onClick={() => setCategory(isActive ? null : cat)}
              >
                {emoji && <span className="mr-1 opacity-80">{emoji}</span>}
                {cat}
              </Badge>
            );
          })}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-1 h-auto px-2 py-0.5 text-xs font-medium text-brand-charcoal/60 hover:text-brand-deep-green"
          onClick={() => setCategoryExpanded(!categoryExpanded)}
        >
          {categoryExpanded ? (
            <>
              Show less <ChevronUp className="ml-1 h-3 w-3" />
            </>
          ) : (
            <>
              All categories <ChevronDown className="ml-1 h-3 w-3" />
            </>
          )}
        </Button>
      </div>

      {/* Row 3: Active filter strip */}
      {activePills.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-brand-deep-green/10 pt-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-deep-green/60">
            Active
          </span>
          {activePills.map((pill) => (
            <span
              key={pill.label}
              className="inline-flex items-center gap-1 rounded-full bg-brand-deep-green/10 px-2.5 py-1 text-xs font-medium text-brand-deep-green"
            >
              {pill.label}
              <button
                type="button"
                onClick={pill.onClear}
                aria-label={`Remove filter ${pill.label}`}
                className="ml-0.5 rounded-full p-0.5 transition hover:bg-brand-deep-green/15"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="ml-auto text-xs font-medium text-brand-charcoal/60 underline-offset-4 transition hover:text-brand-deep-green hover:underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
