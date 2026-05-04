import { EventGridCard } from "./event-grid-card";
import type { Event } from "@/types";

interface TimeSectionProps {
  label: string;
  subtitle?: string;
  events: Event[];
  renderSaveButton?: (event: Event) => React.ReactNode;
}

export function TimeSection({ label, subtitle, events, renderSaveButton }: TimeSectionProps) {
  if (!events.length) return null;

  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-4 flex items-end justify-between px-4 sm:px-0">
        <div>
          <h3 className="font-serif text-xl font-medium text-brand-deep-green sm:text-2xl">
            {label}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <span className="text-sm text-muted-foreground">
          {events.length} {events.length === 1 ? "event" : "events"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {events.map((event) => (
          <EventGridCard
            key={event.id}
            event={event}
            saveButton={renderSaveButton?.(event)}
          />
        ))}
      </div>
    </section>
  );
}
