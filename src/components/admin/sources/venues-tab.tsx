"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VenueAliasForm } from "@/components/admin/ingestion/venue-alias-form";
import { UnresolvedVenueActions } from "@/components/admin/ingestion/unresolved-venue-actions";
import { MobileCardField } from "@/components/admin/mobile-card-field";
import { AlertCircle } from "lucide-react";
import type { VenueAlias, UnresolvedVenue } from "@/types";

interface VenuesTabProps {
  aliases: VenueAlias[];
  unresolvedVenues: UnresolvedVenue[];
}

export function VenuesTab({ aliases, unresolvedVenues }: VenuesTabProps) {
  // Group aliases by canonical name
  const grouped = new Map<string, VenueAlias[]>();
  for (const a of aliases) {
    const existing = grouped.get(a.canonical_name) || [];
    existing.push(a);
    grouped.set(a.canonical_name, existing);
  }

  return (
    <div className="mt-4 space-y-8">
      {/* Add alias form */}
      <div>
        <h2 className="mb-2 text-lg font-semibold">Add Alias</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Map alternate venue names to canonical names for improved deduplication accuracy.
        </p>
        <Card>
          <CardContent className="pt-6">
            <VenueAliasForm />
          </CardContent>
        </Card>
      </div>

      {/* Unresolved venues */}
      {unresolvedVenues.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            Unresolved Venues ({unresolvedVenues.length})
          </h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Venue names from ingested events that didn&apos;t match any known alias.
          </p>

          {/* Desktop table */}
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
                {unresolvedVenues.map((venue) => (
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
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {unresolvedVenues.map((venue) => (
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
          </div>
        </div>
      )}

      {/* Venue aliases table */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">
          Venue Aliases ({aliases.length})
        </h2>

        {/* Desktop table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Canonical Name</TableHead>
                <TableHead>Aliases</TableHead>
                <TableHead className="text-right">Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from(grouped.entries()).map(([canonical, venueAliases]) => (
                <TableRow key={canonical}>
                  <TableCell className="font-medium">{canonical}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {venueAliases.map((a) => (
                        <Badge key={a.id} variant="secondary" className="text-xs">
                          {a.alias}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{venueAliases.length}</TableCell>
                </TableRow>
              ))}
              {grouped.size === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                    No venue aliases configured yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile cards */}
        <div className="space-y-3 md:hidden">
          {Array.from(grouped.entries()).map(([canonical, venueAliases]) => (
            <Card key={canonical} className="py-3">
              <CardContent className="px-4 py-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{canonical}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {venueAliases.length} alias{venueAliases.length !== 1 ? "es" : ""}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {venueAliases.map((a) => (
                    <Badge key={a.id} variant="secondary" className="text-xs">
                      {a.alias}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
          {grouped.size === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No venue aliases configured yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
