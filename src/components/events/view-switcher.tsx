"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { List, LayoutGrid, CalendarDays, Columns3 } from "lucide-react";
import { cn } from "@/lib/utils";

const VIEWS = [
  { value: "list", label: "List", icon: List },
  { value: "grid", label: "Grid", icon: LayoutGrid },
  { value: "calendar", label: "Calendar", icon: CalendarDays },
  { value: "week", label: "Week", icon: Columns3 },
] as const;

export function ViewSwitcher() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") || "list";

  function setView(view: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", view);
    router.push(`/events?${params.toString()}`);
  }

  return (
    <div className="flex gap-1 rounded-md border p-1">
      {VIEWS.map(({ value, label, icon: Icon }) => (
        <Button
          key={value}
          variant="ghost"
          size="sm"
          onClick={() => setView(value)}
          className={cn(
            "gap-1.5",
            currentView === value && "bg-muted"
          )}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      ))}
    </div>
  );
}
