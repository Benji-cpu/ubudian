"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, endOfWeek, endOfMonth, isFriday, nextFriday, nextSunday } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EVENT_CATEGORIES, CATEGORY_EMOJI } from "@/lib/constants";
import { ChevronDown, ChevronUp } from "lucide-react";

function buildDateFilters() {
  const today = new Date();
  return [
    { label: "Today", from: format(today, "yyyy-MM-dd"), to: format(today, "yyyy-MM-dd") },
    { label: "This Week", from: format(today, "yyyy-MM-dd"), to: format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd") },
    { label: "This Weekend", from: format(isFriday(today) ? today : nextFriday(today), "yyyy-MM-dd"), to: format(nextSunday(today), "yyyy-MM-dd") },
    { label: "This Month", from: format(today, "yyyy-MM-dd"), to: format(endOfMonth(today), "yyyy-MM-dd") },
  ];
}

export function EventFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category");
  const activeFrom = searchParams.get("from");
  const activeTo = searchParams.get("to");

  const [dateFilters, setDateFilters] = useState<{ label: string; from: string; to: string }[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setDateFilters(buildDateFilters());
  }, []);

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

  return (
    <div className="space-y-3">
      {/* Category tabs */}
      <div className="relative">
        <div
          className={`flex flex-wrap gap-2 transition-all ${
            expanded ? "" : "max-h-[40px] overflow-hidden"
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
                onClick={() => setCategory(activeCategory === cat ? null : cat)}
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
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>Show less <ChevronUp className="ml-1 h-3 w-3" /></>
          ) : (
            <>Show all categories <ChevronDown className="ml-1 h-3 w-3" /></>
          )}
        </Button>
      </div>

      {/* Date quick filters */}
      <div className="flex flex-wrap gap-2">
        {dateFilters.map((df) => {
          const isActive = activeFrom === df.from && activeTo === df.to;
          return (
            <Button
              key={df.label}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (isActive) {
                  setParams({ from: null, to: null });
                } else {
                  setParams({ from: df.from, to: df.to });
                }
              }}
            >
              {df.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
