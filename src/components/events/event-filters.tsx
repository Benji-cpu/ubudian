"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { nowInBaliDate } from "@/lib/events/bali-time";
import { cn } from "@/lib/utils";
import { MapPin, SlidersHorizontal, X } from "lucide-react";

type DateFilter = { key: string; label: string; from: string; to: string };

function buildDateFilters(): DateFilter[] {
  // Anchor every chip to Bali wall time. The events DB is authored in Bali,
  // so "Today" / "Tomorrow" must match the Bali calendar — not the user's
  // browser or the Vercel UTC clock.
  const today = nowInBaliDate();
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

  // Computed synchronously: buildDateFilters reads Bali wall time via
  // `nowInBaliDate`, which is deterministic on both server and client renders
  // (modulo the few-second seam at Bali midnight — acceptable for a filter
  // chip list).
  const dateFilters = useMemo(() => buildDateFilters(), []);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [venueInput, setVenueInput] = useState(activeVenue || "");
  const isUserTyping = useRef(false);

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

  // Number of filters living in the All-filters drawer. Happening-now lives
  // as a top-level pill now, so it doesn't count.
  const drawerFilterCount =
    (activeTime ? 1 : 0) +
    (activePrice ? 1 : 0) +
    (activeVenue ? 1 : 0);

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
    <div className="space-y-3">
      {/* Row 1: When chips (Today/Tomorrow/Weekend/Week), then a soft divider,
          then secondary modifiers (Happening now / Free / All filters). The
          eyebrow on the left tells the user this row is about WHEN — the
          category row below answers WHAT KIND. Clear axes = less haphazard. */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-deep-green/55 sm:inline dark:text-brand-gold/55">
          When
        </span>
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
                "h-9 rounded-full border-brand-deep-green/15 bg-card/60 px-4 text-xs font-medium tracking-wide text-muted-foreground shadow-sm backdrop-blur-sm transition-all duration-200 dark:border-brand-deep-green/25 dark:bg-card/30",
                "hover:border-brand-deep-green/30 hover:bg-card hover:text-brand-deep-green dark:hover:bg-card/60 dark:hover:text-brand-gold",
                isActive &&
                  "border-brand-deep-green bg-brand-deep-green text-brand-cream shadow-md hover:bg-brand-deep-green hover:text-brand-cream"
              )}
            >
              {df.label}
            </Button>
          );
        })}

        <span
          aria-hidden
          className="mx-1 hidden h-5 w-px bg-brand-deep-green/15 sm:block"
        />

        <Button
          variant="outline"
          size="sm"
          onClick={toggleHappeningNow}
          aria-pressed={activeHappening}
          className={cn(
            "h-9 rounded-full border-brand-deep-green/15 bg-card/60 px-4 text-xs font-medium tracking-wide text-muted-foreground shadow-sm backdrop-blur-sm transition-all duration-200 dark:border-brand-deep-green/25 dark:bg-card/30",
            "hover:border-brand-deep-green/30 hover:bg-card hover:text-brand-deep-green dark:hover:bg-card/60 dark:hover:text-brand-gold",
            activeHappening &&
              "border-brand-terracotta bg-brand-terracotta text-white shadow-md hover:bg-brand-terracotta hover:text-white"
          )}
        >
          <span className="relative mr-2 flex h-2 w-2">
            <span
              className={cn(
                "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                activeHappening ? "bg-white/70" : "bg-brand-terracotta/50"
              )}
            />
            <span
              className={cn(
                "relative inline-flex h-2 w-2 rounded-full",
                activeHappening ? "bg-white" : "bg-brand-terracotta"
              )}
            />
          </span>
          Happening now
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={toggleFreeOnly}
          aria-pressed={activeFreeOnly}
          className={cn(
            "h-9 rounded-full border-brand-deep-green/15 bg-card/60 px-4 text-xs font-medium tracking-wide text-muted-foreground shadow-sm backdrop-blur-sm transition-all duration-200 dark:border-brand-deep-green/25 dark:bg-card/30",
            "hover:border-brand-deep-green/30 hover:bg-card hover:text-brand-deep-green dark:hover:bg-card/60 dark:hover:text-brand-gold",
            activeFreeOnly &&
              "border-brand-gold bg-brand-gold text-brand-deep-green shadow-md hover:bg-brand-gold hover:text-brand-deep-green"
          )}
        >
          Free
        </Button>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 rounded-full border-brand-deep-green/15 bg-card/60 px-4 text-xs font-medium tracking-wide text-foreground/80 shadow-sm backdrop-blur-sm transition-all duration-200 dark:border-brand-deep-green/25 dark:bg-card/30",
                "hover:border-brand-deep-green/30 hover:bg-card hover:text-brand-deep-green dark:hover:bg-card/60 dark:hover:text-brand-gold",
                drawerFilterCount > 0 &&
                  "border-brand-deep-green/40 text-brand-deep-green dark:text-brand-gold dark:border-brand-gold/40"
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
              <SheetDescription className="text-muted-foreground">
                Narrow by time of day, price, venue, or specific dates.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-7 px-4 py-6">
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
                    className="h-10 border-brand-deep-green/15 bg-card/80 pl-9 text-sm dark:border-brand-deep-green/25 dark:bg-card/50"
                  />
                </div>
              </div>
            </div>

            <SheetFooter className="border-t border-brand-deep-green/10 bg-card/60 backdrop-blur-sm dark:border-brand-deep-green/20 dark:bg-card/30">
              <Button
                variant="ghost"
                onClick={clearAll}
                className="text-muted-foreground hover:text-brand-deep-green dark:hover:text-brand-gold"
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

      {/* Row 2: Categories — single horizontal strip, scrolls on mobile.
          Eventbrite-style: keeps the secondary axis (what kind of event)
          visually distinct from the primary axis (when) and prevents the
          chaotic 3-row wrap that earlier versions had. */}
      <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-deep-green/55 dark:text-brand-gold/55">
            Kind
          </span>
          <Badge
            variant={!activeCategory ? "default" : "outline"}
            className={cn(
              "shrink-0 cursor-pointer select-none rounded-full px-3.5 py-1.5 text-xs font-medium tracking-wide transition-all",
              !activeCategory
                ? "border-transparent bg-brand-deep-green text-brand-cream hover:bg-brand-deep-green/90"
                : "border-brand-deep-green/15 bg-transparent text-muted-foreground hover:border-brand-deep-green/40 hover:text-brand-deep-green dark:hover:text-brand-gold dark:hover:border-brand-gold/40"
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
                    : "border-brand-deep-green/15 bg-transparent text-muted-foreground hover:border-brand-deep-green/40 hover:text-brand-deep-green dark:hover:text-brand-gold dark:hover:border-brand-gold/40"
                )}
                onClick={() => setCategory(isActive ? null : cat)}
              >
                {emoji && <span className="mr-1 opacity-80">{emoji}</span>}
                {cat}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Row 3: Active filter strip — sticky under the global header so the
          user can clear filters without scrolling back up after a long
          results list. Header is h-14 (56px) fixed; offset matches. */}
      {activePills.length > 0 && (
        <div className="sticky top-14 z-30 -mx-4 flex flex-wrap items-center gap-2 border-y border-brand-deep-green/10 bg-brand-cream/85 px-4 py-2.5 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 dark:bg-background/85">
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
            className="ml-auto text-xs font-medium text-muted-foreground underline-offset-4 transition hover:text-brand-deep-green hover:underline dark:hover:text-brand-gold"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
