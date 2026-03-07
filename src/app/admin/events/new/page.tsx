import { EventForm } from "@/components/admin/event-form";

export default function NewEventPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">New Event</h1>
      <p className="mt-1 text-muted-foreground">
        Create a new event for the Ubud events directory.
      </p>
      <div className="mt-8">
        <EventForm />
      </div>
    </div>
  );
}
