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
import { EVENT_CATEGORIES, CATEGORY_EMOJI } from "@/lib/constants";
import { PRICE_BRACKETS } from "@/lib/price-parser";
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  SlidersHorizontal,
  Sparkles,
  ImageIcon,
  X,
} from "lucide-react";

function buildDateFilters() {
  const today = new Date();
  const tomorrow = addDays(today, 1);
  return [
    {
      label: "Today",
      from: format(today, "yyyy-MM-dd"),
      to: format(today, "yyyy-MM-dd"),
    },
    {
      label: "Tomorrow",
      from: format(tomorrow, "yyyy-MM-dd"),
      to: format(tomorrow, "yyyy-MM-dd"),
    },
    {
      label: "This Week",
      from: format(today, "yyyy-MM-dd"),
      to: format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    },
    {
      label: "This Weekend",
      from: format(
        isFriday(today) ? today : nextFriday(today),
        "yyyy-MM-dd"
      ),
      to: format(nextSunday(today), "yyyy-MM-dd"),
    },
    {
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
  const activeHasImage = searchParams.get("hasImage") === "true";

  const [dateFilters, setDateFilters] = useState<
    { label: string; from: string; to: string }[]
  >([]);
  const [categoryExpanded, setCategoryExpanded] = useState(false);
  const [advancedExpanded, setAdvancedExpanded] = useState(false);
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
      // Mutual exclusivity: clear date filters
      setParams({ happening: "true", from: null, to: null });
    }
  }

  function toggleDateFilter(df: { from: string; to: string }) {
    const isActive = activeFrom === df.from && activeTo === df.to;
    if (isActive) {
      setParams({ from: null, to: null });
    } else {
      // Mutual exclusivity: clear happening now
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

  function toggleHasImage() {
    setParams({ hasImage: activeHasImage ? null : "true" });
  }

  function clearAllAdvanced() {
    setVenueInput("");
    isUserTyping.current = false;
    setParams({ time: null, price: null, venue: null, free: null, hasImage: null });
  }

  const hasAdvancedFilters = !!(activeTime || activePrice || activeVenue || activeFreeOnly || activeHasImage);

  // Build active filter pills
  const activePills: { label: string; onClear: () => void }[] = [];
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
      label: `"${activeVenue}"`,
      onClear: () => {
        setVenueInput("");
        isUserTyping.current = false;
        setParams({ venue: null });
      },
    });
  }
  if (activeFreeOnly) {
    activePills.push({ label: "Free only", onClear: () => setParams({ free: null }) });
  }
  if (activeHasImage) {
    activePills.push({ label: "Has image", onClear: () => setParams({ hasImage: null }) });
  }

  return (
    <div className="space-y-3">
      {/* Section A: Date & Happening Now */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeHappening ? "default" : "outline"}
          size="sm"
          onClick={toggleHappeningNow}
          className={
            activeHappening
              ? "bg-brand-terracotta hover:bg-brand-terracotta/90 text-white"
              : ""
          }
        >
          <span className="relative mr-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          Happening Now
        </Button>
        {dateFilters.map((df) => {
          const isActive = activeFrom === df.from && activeTo === df.to;
          return (
            <Button
              key={df.label}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => toggleDateFilter(df)}
            >
              {df.label}
            </Button>
          );
        })}
        <Button
          variant={activeFreeOnly ? "default" : "outline"}
          size="sm"
          onClick={toggleFreeOnly}
          aria-pressed={activeFreeOnly}
        >
          <Sparkles className="mr-1 h-3 w-3" />
          Free only
        </Button>
        <Button
          variant={activeHasImage ? "default" : "outline"}
          size="sm"
          onClick={toggleHasImage}
          aria-pressed={activeHasImage}
        >
          <ImageIcon className="mr-1 h-3 w-3" />
          Has image
        </Button>
      </div>

      {/* Section B: Category badges */}
      <div className="relative">
        <div
          className={`flex flex-wrap gap-2 transition-all ${
            categoryExpanded ? "" : "max-h-[40px] overflow-hidden"
          }`}
        >
          <Badge
            variant={!activeCategory ? "default" : "outline"}
            className="shrink-0 cursor-pointer select-none py-1.5 px-3 text-sm"
            onClick={() => setCategory(null)}
          >
            All
          </Badge>
          {EVENT_CATEGORIES.map((cat) => {
            const emoji = CATEGORY_EMOJI[cat] || "";
            return (
              <Badge
                key={cat}
                variant={activeCategory === cat ? "default" : "outline"}
                className="shrink-0 cursor-pointer select-none whitespace-nowrap py-1.5 px-3 text-sm"
                onClick={() =>
                  setCategory(activeCategory === cat ? null : cat)
                }
              >
                {emoji} {cat}
              </Badge>
            );
          })}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-1 h-auto px-2 py-0.5 text-xs text-muted-foreground"
          onClick={() => setCategoryExpanded(!categoryExpanded)}
        >
          {categoryExpanded ? (
            <>
              Show less <ChevronUp className="ml-1 h-3 w-3" />
            </>
          ) : (
            <>
              Show all categories <ChevronDown className="ml-1 h-3 w-3" />
            </>
          )}
        </Button>
      </div>

      {/* Section C: Advanced filters (collapsible on mobile) */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto px-2 py-0.5 text-xs text-muted-foreground sm:hidden"
          onClick={() => setAdvancedExpanded(!advancedExpanded)}
        >
          <SlidersHorizontal className="mr-1 h-3 w-3" />
          {advancedExpanded ? "Hide filters" : "More filters"}
          {hasAdvancedFilters && (
            <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand-terracotta text-[10px] text-white">
              {activePills.length}
            </span>
          )}
        </Button>

        <div
          className={`mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 ${
            advancedExpanded ? "" : "hidden sm:flex"
          }`}
        >
          {/* Time of Day */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Time:
            </span>
            {TIME_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={activeTime === opt.value ? "default" : "outline"}
                size="xs"
                onClick={() => toggleTime(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>

          <span className="hidden h-4 w-px bg-border sm:block" />

          {/* Price Range */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Price:
            </span>
            {PRICE_BRACKETS.map((bracket) => (
              <Button
                key={bracket.value}
                variant={activePrice === bracket.value ? "default" : "outline"}
                size="xs"
                onClick={() => togglePrice(bracket.value)}
              >
                {bracket.label}
              </Button>
            ))}
          </div>

          <span className="hidden h-4 w-px bg-border sm:block" />

          {/* Venue Search */}
          <div className="relative w-full sm:w-44">
            <MapPin className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search venue..."
              value={venueInput}
              onChange={(e) => {
                isUserTyping.current = true;
                setVenueInput(e.target.value);
              }}
              className="h-7 pl-8 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Section D: Active filter pills */}
      {activePills.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activePills.map((pill) => (
            <span
              key={pill.label}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
            >
              {pill.label}
              <button
                onClick={pill.onClear}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            onClick={clearAllAdvanced}
            className="text-xs text-muted-foreground underline hover:text-foreground"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
