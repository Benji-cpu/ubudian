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
import { EVENT_CATEGORIES, categoryShortLabel } from "@/lib/constants";
import { PRICE_BRACKETS } from "@/lib/price-parser";
import { baliCalendarDate } from "@/lib/events/bali-time";
import { EVENT_VIEWS } from "@/lib/events/views";
import { cn } from "@/lib/utils";
import { MapPin, SlidersHorizontal, X } from "lucide-react";

// The two signature categories shown as chips in the default toolbar. "Festivals"
// (the third chip) is NOT a category — it's a one-off-events filter handled via
// the `festivals` param. Every other category lives inside the Filters sheet.
const DANCE = "Dance & Movement";
const TANTRA = "Tantra & Intimacy";

const SORT_OPTIONS = [
  { value: "date", label: "Soonest first" },
  { value: "newest", label: "Recently added" },
] as const;

type DateFilter = { key: string; label: string; from: string; to: string };

function buildDateFilters(): DateFilter[] {
  // Anchor every chip to the Bali calendar — the events DB is authored in Bali,
  // so "Today"/"Tomorrow" must match the Bali wall date, not the browser TZ.
  const today = baliCalendarDate();
  const tomorrow = addDays(today, 1);
  return [
    { key: "today", label: "Today", from: format(today, "yyyy-MM-dd"), to: format(today, "yyyy-MM-dd") },
    { key: "tomorrow", label: "Tomorrow", from: format(tomorrow, "yyyy-MM-dd"), to: format(tomorrow, "yyyy-MM-dd") },
    {
      key: "weekend",
      label: "This Weekend",
      from: format(isFriday(today) ? today : nextFriday(today), "yyyy-MM-dd"),
      to: format(nextSunday(today), "yyyy-MM-dd"),
    },
    { key: "week", label: "This Week", from: format(today, "yyyy-MM-dd"), to: format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd") },
    { key: "month", label: "This Month", from: format(today, "yyyy-MM-dd"), to: format(endOfMonth(today), "yyyy-MM-dd") },
  ];
}

const TIME_OPTIONS = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
] as const;

interface EventFiltersProps {
  /** How many events currently match — shown in the sheet footer button. */
  resultCount?: number;
}

export function EventFilters({ resultCount }: EventFiltersProps = {}) {
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
  const activeFestivals = searchParams.get("festivals") === "true";
  const currentView = searchParams.get("view") || "list";
  const currentSort = searchParams.get("sort") || "date";

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
      if (venueInput) params.set("venue", venueInput);
      else params.delete("venue");
      router.push(`/events?${params.toString()}`);
    }, 300);
    return () => clearTimeout(timeout);
  }, [venueInput]); // eslint-disable-line react-hooks/exhaustive-deps

  function setParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) params.delete(key);
      else params.set(key, value);
    });
    router.push(`/events?${params.toString()}`);
  }

  function setCategory(cat: string | null) {
    // Category and the Festivals one-off filter are mutually exclusive — their
    // intersection is almost always empty, so picking one clears the other.
    setParams({ category: cat, festivals: null });
  }

  function toggleCategoryChip(cat: string) {
    setCategory(activeCategory === cat ? null : cat);
  }

  function toggleFestivals() {
    if (activeFestivals) setParams({ festivals: null });
    else setParams({ festivals: "true", category: null });
  }

  function setView(value: string) {
    // "list" is the page default — drop the param to keep URLs clean.
    setParams({ view: value === "list" ? null : value });
  }

  function setSort(value: string) {
    setParams({ sort: value === "date" ? null : value });
  }

  function toggleHappeningNow() {
    if (activeHappening) setParams({ happening: null });
    else setParams({ happening: "true", from: null, to: null });
  }

  function toggleDateFilter(df: DateFilter) {
    const isActive = activeFrom === df.from && activeTo === df.to;
    if (isActive) setParams({ from: null, to: null });
    else setParams({ from: df.from, to: df.to, happening: null });
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

  // Count of active CONTENT filters tucked inside the sheet (modes — view/sort —
  // don't count; their effect is visible in the list itself).
  const drawerFilterCount =
    (activeHappening ? 1 : 0) +
    (activeFrom && activeTo ? 1 : 0) +
    (activeTime ? 1 : 0) +
    (activePrice ? 1 : 0) +
    (activeFreeOnly ? 1 : 0) +
    (activeVenue ? 1 : 0) +
    // A category that isn't one of the two visible chips is "hidden" in the sheet.
    (activeCategory && activeCategory !== DANCE && activeCategory !== TANTRA ? 1 : 0);

  // Active-filter pills (the removable strip). Modes (view/sort) are excluded.
  const activePills: { label: string; onClear: () => void }[] = [];
  if (activeHappening) activePills.push({ label: "Happening now", onClear: () => setParams({ happening: null }) });
  if (activeFestivals) activePills.push({ label: "Festivals", onClear: () => setParams({ festivals: null }) });
  if (activeFrom && activeTo) {
    const matched = dateFilters.find((df) => df.from === activeFrom && df.to === activeTo);
    activePills.push({
      label: matched ? matched.label : `${activeFrom} → ${activeTo}`,
      onClear: () => setParams({ from: null, to: null }),
    });
  }
  if (activeFreeOnly) activePills.push({ label: "Free only", onClear: () => setParams({ free: null }) });
  if (activeTime) {
    const label = TIME_OPTIONS.find((t) => t.value === activeTime)?.label || activeTime;
    activePills.push({ label, onClear: () => setParams({ time: null }) });
  }
  if (activePrice) {
    const label = PRICE_BRACKETS.find((b) => b.value === activePrice)?.label || activePrice;
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
    activePills.push({ label: categoryShortLabel(activeCategory), onClear: () => setCategory(null) });
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
      festivals: null,
      view: null,
      sort: null,
    });
  }

  // --- shared styling ---
  const chipBase =
    "h-9 rounded-full border px-4 text-xs font-medium tracking-wide shadow-sm backdrop-blur-sm transition-all duration-200 border-brand-deep-green/15 bg-card/60 text-muted-foreground dark:border-brand-deep-green/25 dark:bg-card/30 hover:border-brand-deep-green/30 hover:text-brand-deep-green dark:hover:text-brand-gold";
  // Active brand pill — green in light, gold in dark (gold is the non-inverting
  // signature accent; sage-on-dark would be ambiguous against the card).
  const chipActiveGreen =
    "border-brand-deep-green bg-brand-deep-green text-brand-cream shadow-md hover:bg-brand-deep-green hover:text-brand-cream dark:border-brand-gold dark:bg-brand-gold dark:text-[#2C4A3E] dark:hover:bg-brand-gold dark:hover:text-[#2C4A3E]";
  // Festivals reads as "special" — gold in both modes.
  const chipActiveGold =
    "border-brand-gold bg-brand-gold text-[#2C4A3E] shadow-md hover:bg-brand-gold hover:text-[#2C4A3E] dark:text-[#2C4A3E]";
  const sheetPill =
    "h-9 rounded-full border-brand-deep-green/15 px-4 text-xs";
  const sheetPillActive =
    "border-brand-deep-green bg-brand-deep-green text-brand-cream hover:bg-brand-deep-green hover:text-brand-cream dark:border-brand-gold dark:bg-brand-gold dark:text-[#2C4A3E] dark:hover:bg-brand-gold";
  const sectionLabel =
    "mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand-deep-green/70 dark:text-brand-gold/70";

  return (
    <div className="min-w-0 space-y-3">
      {/* Default toolbar — three chips + one Filters button. Wraps on mobile. */}
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => toggleCategoryChip(DANCE)}
          aria-pressed={activeCategory === DANCE}
          className={cn(chipBase, activeCategory === DANCE && chipActiveGreen)}
        >
          Dance
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toggleCategoryChip(TANTRA)}
          aria-pressed={activeCategory === TANTRA}
          className={cn(chipBase, activeCategory === TANTRA && chipActiveGreen)}
        >
          Tantra
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleFestivals}
          aria-pressed={activeFestivals}
          className={cn(chipBase, activeFestivals && chipActiveGold)}
        >
          Festivals
        </Button>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "ml-auto h-9 rounded-full border-brand-deep-green/15 bg-card/60 px-4 text-xs font-medium tracking-wide text-foreground/80 shadow-sm backdrop-blur-sm transition-all duration-200 dark:border-brand-deep-green/25 dark:bg-card/30",
                "hover:border-brand-deep-green/30 hover:bg-card hover:text-brand-deep-green dark:hover:bg-card/60 dark:hover:text-brand-gold",
                drawerFilterCount > 0 &&
                  "border-brand-deep-green/40 text-brand-deep-green dark:border-brand-gold/40 dark:text-brand-gold"
              )}
            >
              <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
              Filters
              {drawerFilterCount > 0 && (
                <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-deep-green px-1.5 text-[10px] font-semibold text-brand-cream dark:bg-brand-gold dark:text-[#2C4A3E]">
                  {drawerFilterCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full overflow-y-auto bg-brand-cream sm:max-w-md">
            <SheetHeader>
              <SheetTitle className="font-serif text-2xl text-brand-deep-green dark:text-brand-gold">
                Filters
              </SheetTitle>
              <SheetDescription className="text-muted-foreground">
                View, sort, category, dates, time, price and venue.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-7 px-4 py-6">
              {/* View */}
              <div>
                <h3 className={sectionLabel}>View</h3>
                <div className="flex flex-wrap gap-2">
                  {EVENT_VIEWS.map(({ value, label, icon: Icon }) => {
                    const isActive = currentView === value;
                    return (
                      <Button
                        key={value}
                        variant="outline"
                        size="sm"
                        onClick={() => setView(value)}
                        aria-pressed={isActive}
                        className={cn(sheetPill, "gap-1.5", isActive && sheetPillActive)}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Sort */}
              <div>
                <h3 className={sectionLabel}>Sort</h3>
                <div className="flex flex-wrap gap-2">
                  {SORT_OPTIONS.map((opt) => (
                    <Button
                      key={opt.value}
                      variant="outline"
                      size="sm"
                      onClick={() => setSort(opt.value)}
                      aria-pressed={currentSort === opt.value}
                      className={cn(sheetPill, currentSort === opt.value && sheetPillActive)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <h3 className={sectionLabel}>Category</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={!activeCategory ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer select-none rounded-full px-3.5 py-1.5 text-xs font-medium tracking-wide transition-all",
                      !activeCategory
                        ? "border-transparent bg-brand-deep-green text-brand-cream hover:bg-brand-deep-green/90 dark:bg-brand-gold dark:text-[#2C4A3E]"
                        : "border-brand-deep-green/15 bg-transparent text-muted-foreground hover:border-brand-deep-green/40 hover:text-brand-deep-green dark:hover:border-brand-gold/40 dark:hover:text-brand-gold"
                    )}
                    onClick={() => setCategory(null)}
                  >
                    All
                  </Badge>
                  {EVENT_CATEGORIES.map((cat) => {
                    const isActive = activeCategory === cat;
                    return (
                      <Badge
                        key={cat}
                        variant={isActive ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer select-none whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium tracking-wide transition-all",
                          isActive
                            ? "border-transparent bg-brand-deep-green text-brand-cream hover:bg-brand-deep-green/90 dark:bg-brand-gold dark:text-[#2C4A3E]"
                            : "border-brand-deep-green/15 bg-transparent text-muted-foreground hover:border-brand-deep-green/40 hover:text-brand-deep-green dark:hover:border-brand-gold/40 dark:hover:text-brand-gold"
                        )}
                        onClick={() => setCategory(isActive ? null : cat)}
                      >
                        {categoryShortLabel(cat)}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {/* When */}
              <div>
                <h3 className={sectionLabel}>When</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleHappeningNow}
                    aria-pressed={activeHappening}
                    className={cn(
                      sheetPill,
                      activeHappening &&
                        "border-brand-terracotta bg-brand-terracotta text-white hover:bg-brand-terracotta hover:text-white"
                    )}
                  >
                    Happening now
                  </Button>
                  {dateFilters.map((df) => {
                    const isActive = activeFrom === df.from && activeTo === df.to;
                    return (
                      <Button
                        key={df.key}
                        variant="outline"
                        size="sm"
                        onClick={() => toggleDateFilter(df)}
                        aria-pressed={isActive}
                        className={cn(sheetPill, isActive && sheetPillActive)}
                      >
                        {df.label}
                      </Button>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="date"
                    aria-label="From date"
                    value={activeFrom ?? ""}
                    onChange={(e) => setParams({ from: e.target.value || null, happening: null })}
                    className="h-9 rounded-md border border-brand-deep-green/15 bg-card/80 px-3 text-sm text-foreground dark:border-brand-deep-green/25 dark:bg-card/50 dark:[color-scheme:dark]"
                  />
                  <span className="text-muted-foreground">→</span>
                  <input
                    type="date"
                    aria-label="To date"
                    value={activeTo ?? ""}
                    onChange={(e) => setParams({ to: e.target.value || null, happening: null })}
                    className="h-9 rounded-md border border-brand-deep-green/15 bg-card/80 px-3 text-sm text-foreground dark:border-brand-deep-green/25 dark:bg-card/50 dark:[color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Time of day */}
              <div>
                <h3 className={sectionLabel}>Time of day</h3>
                <div className="flex flex-wrap gap-2">
                  {TIME_OPTIONS.map((opt) => (
                    <Button
                      key={opt.value}
                      variant="outline"
                      size="sm"
                      onClick={() => toggleTime(opt.value)}
                      aria-pressed={activeTime === opt.value}
                      className={cn(sheetPill, activeTime === opt.value && sheetPillActive)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <h3 className={sectionLabel}>Price</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleFreeOnly}
                    aria-pressed={activeFreeOnly}
                    className={cn(
                      sheetPill,
                      activeFreeOnly &&
                        "border-brand-gold bg-brand-gold text-[#2C4A3E] hover:bg-brand-gold hover:text-[#2C4A3E]"
                    )}
                  >
                    Free
                  </Button>
                  {PRICE_BRACKETS.map((bracket) => (
                    <Button
                      key={bracket.value}
                      variant="outline"
                      size="sm"
                      onClick={() => togglePrice(bracket.value)}
                      aria-pressed={activePrice === bracket.value}
                      className={cn(sheetPill, activePrice === bracket.value && sheetPillActive)}
                    >
                      {bracket.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Venue */}
              <div>
                <h3 className={sectionLabel}>Venue</h3>
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
                <Button className="bg-brand-deep-green text-brand-cream hover:bg-brand-deep-green/90 dark:bg-brand-gold dark:text-[#2C4A3E] dark:hover:bg-brand-gold/90">
                  {typeof resultCount === "number"
                    ? resultCount === 0
                      ? "No matches — adjust"
                      : `Show ${resultCount} ${resultCount === 1 ? "event" : "events"}`
                    : "Show events"}
                </Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active-filter strip — sticky under the global header so filters can be
          cleared without scrolling back up. Header is h-14 (56px); offset matches. */}
      {activePills.length > 0 && (
        <div className="sticky top-14 z-30 -mx-4 flex flex-wrap items-center gap-2 border-y border-brand-deep-green/10 bg-brand-cream/85 px-4 py-2.5 backdrop-blur-md dark:bg-background/85 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-deep-green/60 dark:text-brand-gold/70">
            Active
          </span>
          {activePills.map((pill) => (
            <span
              key={pill.label}
              className="inline-flex items-center gap-1 rounded-full bg-brand-deep-green/10 px-2.5 py-1 text-xs font-medium text-brand-deep-green dark:bg-brand-gold/15 dark:text-brand-gold"
            >
              {pill.label}
              <button
                type="button"
                onClick={pill.onClear}
                aria-label={`Remove filter ${pill.label}`}
                className="ml-0.5 rounded-full p-0.5 transition hover:bg-brand-deep-green/15 dark:hover:bg-brand-gold/25"
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
