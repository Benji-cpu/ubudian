"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sparkles, List, LayoutGrid, CalendarDays, Columns3, Map as MapIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const VIEWS = [
  {
    value: "feed",
    label: "Feed",
    description: "Curated timeline grouped by time",
    icon: Sparkles,
  },
  {
    value: "list",
    label: "List",
    description: "Detailed list, sorted by date and time",
    icon: List,
  },
  {
    value: "grid",
    label: "Grid",
    description: "Visual grid of event covers",
    icon: LayoutGrid,
  },
  {
    value: "calendar",
    label: "Calendar",
    description: "Month-at-a-glance calendar",
    icon: CalendarDays,
  },
  {
    value: "week",
    label: "Week",
    description: "Seven-day schedule view",
    icon: Columns3,
  },
  {
    value: "map",
    label: "Map",
    description: "Geographic map of venues",
    icon: MapIcon,
  },
] as const;

export function ViewSwitcher() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") || "feed";

  function setView(view: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", view);
    router.push(`/events?${params.toString()}`);
  }

  return (
    <div
      className="flex h-10 items-center gap-0.5 rounded-md border border-brand-deep-green/15 bg-white/60 p-0.5 shadow-sm backdrop-blur-sm"
      role="tablist"
      aria-label="Choose how to view events"
    >
      {VIEWS.map(({ value, label, description, icon: Icon }) => {
        const isActive = currentView === value;
        return (
          <Tooltip key={value}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView(value)}
                role="tab"
                aria-selected={isActive}
                aria-label={`${label} view — ${description}`}
                className={cn(
                  "h-9 gap-1.5 rounded-[5px] px-2.5 text-brand-charcoal/70 transition-all duration-200",
                  "hover:bg-brand-deep-green/5 hover:text-brand-deep-green",
                  "focus-visible:ring-2 focus-visible:ring-brand-gold/40",
                  isActive &&
                    "bg-brand-deep-green text-brand-cream shadow-sm hover:bg-brand-deep-green hover:text-brand-cream"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden text-xs font-medium sm:inline">
                  {label}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <span className="font-semibold">{label}</span>
              <span className="ml-1.5 opacity-70">— {description}</span>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
