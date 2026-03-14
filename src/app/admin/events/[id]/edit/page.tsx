import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventForm } from "@/components/admin/event-form";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, ExternalLink, Info } from "lucide-react";
import type { Event, EventSource } from "@/types";

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

  const typedEvent = event as Event;

  let source: EventSource | null = null;
  if (typedEvent.source_id) {
    const { data } = await supabase
      .from("event_sources")
      .select("*")
      .eq("id", typedEvent.source_id)
      .single();
    source = data as EventSource | null;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Edit Event</h1>
      <p className="mt-1 text-muted-foreground">
        Update this event.
      </p>

      {source && (
        <Card className="mt-4 border-blue-200 bg-blue-50/50">
          <CardContent className="flex items-start gap-3 py-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <div className="text-sm text-blue-800">
              <span>
                This event was auto-ingested from{" "}
                <strong>{source.source_type.charAt(0).toUpperCase() + source.source_type.slice(1)}</strong>
                {" "}({source.name})
              </span>
              {typedEvent.llm_parsed && (
                <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                  <Bot className="h-2.5 w-2.5" /> AI-parsed
                </span>
              )}
              {typedEvent.raw_message_id && (
                <Link
                  href={`/admin/ingestion/messages?highlight=${typedEvent.raw_message_id}`}
                  className="ml-2 inline-flex items-center gap-1 text-blue-600 hover:underline"
                >
                  View raw message <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-8">
        <EventForm initialData={typedEvent} />
      </div>
    </div>
  );
}
