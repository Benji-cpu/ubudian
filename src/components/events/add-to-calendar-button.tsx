"use client";

import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateICS } from "@/lib/calendar";
import type { Event } from "@/types";

interface AddToCalendarButtonProps {
  event: Event;
}

export function AddToCalendarButton({ event }: AddToCalendarButtonProps) {
  function handleDownload() {
    const ics = generateICS(event);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.slug || "event"}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDownload}>
      <CalendarPlus className="mr-1.5 h-4 w-4" />
      Add to Calendar
    </Button>
  );
}
