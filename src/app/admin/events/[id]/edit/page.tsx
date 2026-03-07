import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventForm } from "@/components/admin/event-form";
import type { Event } from "@/types";

interface EditEventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (!event) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Edit Event</h1>
      <p className="mt-1 text-muted-foreground">
        Update this event.
      </p>
      <div className="mt-8">
        <EventForm initialData={event as Event} />
      </div>
    </div>
  );
}
