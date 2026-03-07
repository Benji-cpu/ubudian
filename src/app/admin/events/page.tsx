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
import { Plus, Calendar, ShieldCheck } from "lucide-react";
import type { Event } from "@/types";
import { DeleteEventButton } from "./delete-button";

interface TrustedSubmitter {
  email: string;
  approved_count: number;
  auto_approve: boolean;
}

const statusVariant: Record<string, "secondary" | "default" | "outline" | "destructive"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
  archived: "outline",
};

function EventTable({ items, trustedMap }: { items: Event[]; trustedMap: Record<string, TrustedSubmitter> }) {
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

  const [{ data: events }, { data: trusted }] = await Promise.all([
    supabase.from("events").select("*").order("created_at", { ascending: false }),
    supabase.from("trusted_submitters").select("*"),
  ]);

  const allEvents = (events ?? []) as Event[];
  const trustedMap: Record<string, TrustedSubmitter> = {};
  ((trusted ?? []) as TrustedSubmitter[]).forEach((t) => {
    trustedMap[t.email] = t;
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
            <EventTable items={allEvents} trustedMap={trustedMap} />
          </TabsContent>
          <TabsContent value="pending" className="mt-4">
            <EventTable items={pending} trustedMap={trustedMap} />
          </TabsContent>
          <TabsContent value="approved" className="mt-4">
            <EventTable items={approved} trustedMap={trustedMap} />
          </TabsContent>
          <TabsContent value="other" className="mt-4">
            <EventTable items={other} trustedMap={trustedMap} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
