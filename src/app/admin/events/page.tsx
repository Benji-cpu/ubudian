import Link from "next/link";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Calendar, ShieldCheck, Bot } from "lucide-react";
import type { Event, EventSource } from "@/types";
import { DeleteEventButton } from "./delete-button";

interface TrustedSubmitter {
  email: string;
  approved_count: number;
  auto_approve: boolean;
}

const sourceBadgeStyles: Record<string, string> = {
  telegram: "border-blue-300 text-blue-700 bg-blue-50",
  whatsapp: "border-green-300 text-green-700 bg-green-50",
  api: "border-purple-300 text-purple-700 bg-purple-50",
  scraper: "border-orange-300 text-orange-700 bg-orange-50",
};

const sourceEmoji: Record<string, string> = {
  telegram: "📨",
  whatsapp: "💬",
  api: "🔗",
  scraper: "🔗",
};

function SourceBadge({ event, sourceMap }: { event: Event; sourceMap: Record<string, EventSource> }) {
  if (!event.source_id) return null;
  const source = sourceMap[event.source_id];
  if (!source) return null;

  const styles = sourceBadgeStyles[source.source_type] ?? "border-gray-300 text-gray-700 bg-gray-50";
  const emoji = sourceEmoji[source.source_type] ?? "🔗";

  return (
    <span className="inline-flex items-center gap-1">
      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${styles}`}>
        {emoji} {source.source_type.charAt(0).toUpperCase() + source.source_type.slice(1)}
      </span>
      {event.llm_parsed && (
        <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
          <Bot className="h-2.5 w-2.5" /> AI
        </span>
      )}
    </span>
  );
}

const statusVariant: Record<string, "secondary" | "default" | "outline" | "destructive"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
  archived: "outline",
};

function EventTable({ items, trustedMap, sourceMap }: { items: Event[]; trustedMap: Record<string, TrustedSubmitter>; sourceMap: Record<string, EventSource> }) {
  if (items.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No events in this category.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Venue</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((event) => (
          <TableRow key={event.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/events/${event.id}/edit`}
                  className="font-medium hover:underline"
                >
                  {event.title}
                </Link>
                {event.submitted_by_email && trustedMap[event.submitted_by_email.toLowerCase()] && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-pale-green px-2 py-0.5 text-[10px] font-medium text-brand-deep-green">
                    <ShieldCheck className="h-3 w-3" />
                    Trusted ({trustedMap[event.submitted_by_email.toLowerCase()].approved_count})
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="text-xs">
                {event.category}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {format(new Date(event.start_date), "MMM d, yyyy")}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {event.venue_name || "—"}
            </TableCell>
            <TableCell>
              <SourceBadge event={event} sourceMap={sourceMap} />
            </TableCell>
            <TableCell>
              <Badge variant={statusVariant[event.status]}>
                {event.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/admin/events/${event.id}/edit`}>Edit</Link>
                </Button>
                <DeleteEventButton eventId={event.id} eventTitle={event.title} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default async function AdminEventsPage() {
  const supabase = await createClient();

  const [{ data: events }, { data: trusted }, { data: sources }] = await Promise.all([
    supabase.from("events").select("*").order("created_at", { ascending: false }),
    supabase.from("trusted_submitters").select("*"),
    supabase.from("event_sources").select("id, name, slug, source_type"),
  ]);

  const allEvents = (events ?? []) as Event[];
  const trustedMap: Record<string, TrustedSubmitter> = {};
  ((trusted ?? []) as TrustedSubmitter[]).forEach((t) => {
    trustedMap[t.email] = t;
  });
  const sourceMap: Record<string, EventSource> = {};
  ((sources ?? []) as EventSource[]).forEach((s) => {
    sourceMap[s.id] = s;
  });

  const pending = allEvents.filter((e) => e.status === "pending");
  const approved = allEvents.filter((e) => e.status === "approved");
  const other = allEvents.filter((e) => e.status === "rejected" || e.status === "archived");

  if (allEvents.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Events</h1>
          <Button asChild>
            <Link href="/admin/events/new">
              <Plus className="mr-2 h-4 w-4" />
              New Event
            </Link>
          </Button>
        </div>
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground/40" />
            <CardTitle className="mt-4 text-lg">No events yet</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first event to get started.
            </p>
            <Button asChild className="mt-4">
              <Link href="/admin/events/new">
                <Plus className="mr-2 h-4 w-4" />
                New Event
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Events</h1>
        <Button asChild>
          <Link href="/admin/events/new">
            <Plus className="mr-2 h-4 w-4" />
            New Event
          </Link>
        </Button>
      </div>

      <div className="mt-6">
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All ({allEvents.length})</TabsTrigger>
            <TabsTrigger value="pending">
              Pending {pending.length > 0 && `(${pending.length})`}
            </TabsTrigger>
            <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
            <TabsTrigger value="other">Rejected/Archived ({other.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            <EventTable items={allEvents} trustedMap={trustedMap} sourceMap={sourceMap} />
          </TabsContent>
          <TabsContent value="pending" className="mt-4">
            <EventTable items={pending} trustedMap={trustedMap} sourceMap={sourceMap} />
          </TabsContent>
          <TabsContent value="approved" className="mt-4">
            <EventTable items={approved} trustedMap={trustedMap} sourceMap={sourceMap} />
          </TabsContent>
          <TabsContent value="other" className="mt-4">
            <EventTable items={other} trustedMap={trustedMap} sourceMap={sourceMap} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
