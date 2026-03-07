import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { VenueAliasForm } from "@/components/admin/ingestion/venue-alias-form";
import type { VenueAlias } from "@/types";

export default async function VenueAliasesPage() {
  const supabase = await createClient();

  const { data: aliases } = await supabase
    .from("venue_aliases")
    .select("*")
    .order("canonical_name");

  const { count: unresolvedCount } = await supabase
    .from("unresolved_venues")
    .select("*", { count: "exact", head: true })
    .eq("status", "unresolved");

  const allAliases = (aliases ?? []) as VenueAlias[];

  // Group by canonical name
  const grouped = new Map<string, VenueAlias[]>();
  for (const a of allAliases) {
    const existing = grouped.get(a.canonical_name) || [];
    existing.push(a);
    grouped.set(a.canonical_name, existing);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/ingestion">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Venue Aliases</h1>
        {(unresolvedCount ?? 0) > 0 && (
          <Button asChild variant="outline" size="sm" className="ml-auto">
            <Link href="/admin/ingestion/venues/unresolved">
              <AlertCircle className="mr-1 h-3 w-3" />
              {unresolvedCount} Unresolved
            </Link>
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Map alternate venue names to canonical names for improved deduplication accuracy.
        The ingestion pipeline normalizes venue names using these aliases.
      </p>

      <Card>
        <CardContent className="pt-6">
          <VenueAliasForm />
        </CardContent>
      </Card>

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
                    <span
                      key={a.id}
                      className="inline-block rounded-full bg-muted px-2 py-0.5 text-xs"
                    >
                      {a.alias}
                    </span>
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
  );
}
