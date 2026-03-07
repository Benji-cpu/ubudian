import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import { TriggerRunButton } from "@/components/admin/ingestion/trigger-run-button";
import type { EventSource } from "@/types";

export default async function SourcesPage() {
  const supabase = await createClient();

  const { data: sources } = await supabase
    .from("event_sources")
    .select("*")
    .order("created_at", { ascending: false });

  const allSources = (sources ?? []) as EventSource[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Event Sources</h1>
        <Button asChild>
          <Link href="/admin/ingestion/sources/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Source
          </Link>
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Interval</TableHead>
            <TableHead className="text-right">Events</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allSources.map((source) => (
            <TableRow key={source.id}>
              <TableCell className="font-medium">{source.name}</TableCell>
              <TableCell>
                <Badge variant="outline">{source.source_type}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={source.is_enabled ? "default" : "secondary"}>
                  {source.is_enabled ? "Active" : "Disabled"}
                </Badge>
              </TableCell>
              <TableCell>{source.fetch_interval_minutes}m</TableCell>
              <TableCell className="text-right">{source.events_ingested_count}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <TriggerRunButton sourceId={source.id} sourceName={source.name} />
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/admin/ingestion/sources/${source.id}/edit`}>
                      Edit
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {allSources.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                No sources configured yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
