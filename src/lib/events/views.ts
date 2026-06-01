import {
  List,
  LayoutGrid,
  CalendarDays,
  Columns3,
  Map as MapIcon,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export interface EventView {
  value: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

/**
 * The /events view modes, in display order. List leads — it's the default and
 * the primary way people scan what's on. The rest live inside the Filters
 * sheet. `value` maps to the `?view=` search param read in `events/page.tsx`.
 */
export const EVENT_VIEWS: EventView[] = [
  { value: "list", label: "List", description: "A simple list, by date and time", icon: List },
  { value: "grid", label: "Grid", description: "Visual grid of event covers", icon: LayoutGrid },
  { value: "calendar", label: "Calendar", description: "Month-at-a-glance", icon: CalendarDays },
  { value: "week", label: "Week", description: "Seven-day schedule", icon: Columns3 },
  { value: "map", label: "Map", description: "Map of venues", icon: MapIcon },
  { value: "feed", label: "Feed", description: "Curated timeline", icon: Sparkles },
];
