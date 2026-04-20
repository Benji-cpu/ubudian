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
import { Plus, Calendar, ShieldCheck, Bot, ImageIcon, DollarSign, FileText, MapPin } from "lucide-react";
import { MobileCardField } from "@/components/admin/mobile-card-field";
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

function SourceBadge({ event, sourceMap, chatName }: { event: Event; sourceMap: Record<string, EventSource>; chatName?: string | null }) {
  if (!event.source_id) return null;
  const source = sourceMap[event.source_id];
  if (!source) return null;

  const styles = sourceBadgeStyles[source.source_type] ?? "border-gray-300 text-gray-700 bg-gray-50";
  const emoji = sourceEmoji[source.source_type] ?? "🔗";

  return (
    <span className="inline-flex flex-col gap-0.5">
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
      {chatName && (
        <span className="text-[10px] text-muted-foreground truncate max-w-[150px]" title={chatName}>
          {chatName}
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

type EventWithChatName = Event & {
  raw_ingestion_messages?: { chat_name: string | null } | { chat_name: string | null }[] | null;
};

function QualityIndicator({ event }: { event: Event }) {
  const checks: { label: string; present: boolean; Icon: typeof ImageIcon }[] = [
    { label: "Image", present: !!event.cover_image_url, Icon: ImageIcon },
    { label: "Price", present: !!event.price_info, Icon: DollarSign },
    {
      label: "Description",
      present: !!event.short_description || (event.description?.length ?? 0) > 30,
      Icon: FileText,
    },
    { label: "Venue", present: !!event.venue_name, Icon: MapPin },
  ];
  const score = checks.filter((c) => c.present).length;
  const tooltip = checks
    .map((c) => `${c.present ? "✓" : "·"} ${c.label}`)
    .join("  ");
  return (
    <span
      className="inline-flex items-center gap-0.5"
      title={`${score}/4 fields filled — ${tooltip}`}
    >
      {checks.map(({ label, present, Icon }) => (
        <Icon
          key={label}
          className={`h-3.5 w-3.5 ${present ? "text-brand-deep-green" : "text-muted-foreground/30"}`}
          aria-label={`${label} ${present ? "present" : "missing"}`}
        />
      ))}
    </span>
  );
}

function getEventChatName(event: EventWithChatName): string | null {
  const raw = event.raw_ingestion_messages;
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0]?.chat_name ?? null;
  return raw.chat_name;
}

function EventTable({ items, trustedMap, sourceMap }: { items: EventWithChatName[]; trustedMap: Record<string, TrustedSubmitter>; sourceMap: Record<string, EventSource> }) {
  if (items.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No events in this category.
      </div>
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Quality</TableHead>
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
                  <SourceBadge event={event} sourceMap={sourceMap} chatName={getEventChatName(event)} />
                </TableCell>
                <TableCell>
                  <QualityIndicator event={event} />
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
      </div>

      <div className="space-y-3 md:hidden">
        {items.map((event) => (
          <Card key={event.id} className="py-3">
            <CardContent className="px-4 py-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Link
                    href={`/admin/events/${event.id}/edit`}
                    className="font-medium text-sm hover:underline truncate"
                  >
                    {event.title}
                  </Link>
                  {event.submitted_by_email && trustedMap[event.submitted_by_email.toLowerCase()] && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-pale-green px-2 py-0.5 text-[10px] font-medium text-brand-deep-green shrink-0">
                      <ShieldCheck className="h-3 w-3" />
                      Trusted ({trustedMap[event.submitted_by_email.toLowerCase()].approved_count})
                    </span>
                  )}
                </div>
                <Badge variant={statusVariant[event.status]} className="shrink-0">
                  {event.status}
                </Badge>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {event.category}
                </Badge>
                <SourceBadge event={event} sourceMap={sourceMap} chatName={getEventChatName(event)} />
                <QualityIndicator event={event} />
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-2">
                <MobileCardField label="Date">{format(new Date(event.start_date), "MMM d, yyyy")}</MobileCardField>
                <MobileCardField label="Venue">{event.venue_name || "—"}</MobileCardField>
              </dl>
              <div className="flex items-center gap-2 border-t pt-2 mt-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/admin/events/${event.id}/edit`}>Edit</Link>
                </Button>
                <DeleteEventButton eventId={event.id} eventTitle={event.title} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

export default async function AdminEventsPage() {
  const supabase = await createClient();

  const [{ data: events }, { data: trusted }, { data: sources }] = await Promise.all([
    supabase
      .from("events")
      .select("*, raw_ingestion_messages!raw_message_id(chat_name)")
      .order("created_at", { ascending: false }),
    supabase.from("trusted_submitters").select("*"),
    supabase.from("event_sources").select("id, name, slug, source_type"),
  ]);

  const allEvents = (events ?? []) as EventWithChatName[];
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
