import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { UnresolvedVenueActions } from "@/components/admin/ingestion/unresolved-venue-actions";
import { MobileCardField } from "@/components/admin/mobile-card-field";
import type { UnresolvedVenue } from "@/types";

export default async function UnresolvedVenuesPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("unresolved_venues")
    .select("*")
    .eq("status", "unresolved")
    .order("seen_count", { ascending: false });

  const venues = (data ?? []) as UnresolvedVenue[];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/ingestion/venues">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Unresolved Venues</h1>
        <span className="rounded-full bg-muted px-2 py-0.5 text-sm text-muted-foreground">
          {venues.length}
        </span>
      </div>

      <p className="text-sm text-muted-foreground">
        Venue names from ingested events that didn&apos;t match any known alias.
        Resolve them to create alias mappings, or ignore if they&apos;re not real venues.
      </p>

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Raw Name</TableHead>
              <TableHead className="text-center">Seen</TableHead>
              <TableHead>First Seen</TableHead>
              <TableHead>Last Seen</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {venues.map((venue) => (
              <TableRow key={venue.id}>
                <TableCell className="font-medium">{venue.raw_name}</TableCell>
                <TableCell className="text-center">{venue.seen_count}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(venue.first_seen_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(venue.last_seen_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <UnresolvedVenueActions
                    venueId={venue.id}
                    rawName={venue.raw_name}
                  />
                </TableCell>
              </TableRow>
            ))}
            {venues.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No unresolved venues. All venue names are mapped or ignored.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 md:hidden">
        {venues.map((venue) => (
          <Card key={venue.id} className="py-3">
            <CardContent className="px-4 py-0">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{venue.raw_name}</p>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {venue.seen_count}x seen
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <MobileCardField label="First Seen">
                  {new Date(venue.first_seen_at).toLocaleDateString()}
                </MobileCardField>
                <MobileCardField label="Last Seen">
                  {new Date(venue.last_seen_at).toLocaleDateString()}
                </MobileCardField>
              </div>
              <div className="mt-2 border-t pt-2">
                <UnresolvedVenueActions
                  venueId={venue.id}
                  rawName={venue.raw_name}
                />
              </div>
            </CardContent>
          </Card>
        ))}
        {venues.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No unresolved venues. All venue names are mapped or ignored.
          </p>
        )}
      </div>
    </div>
  );
}
