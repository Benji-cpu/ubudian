import { NotFoundContent } from "@/components/ui/not-found-content";

export default function EventsNotFound() {
  return (
    <NotFoundContent
      title="Event not found"
      description="This event doesn't exist or may have passed."
      backHref="/events"
      backLabel="Browse all events"
    />
  );
}
