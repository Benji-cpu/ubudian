import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IngestionStats } from "@/components/admin/ingestion/ingestion-stats";
import { SourceHealthCard } from "@/components/admin/ingestion/source-health-card";
import { RunHistoryTable } from "@/components/admin/ingestion/run-history-table";
import { TriggerRunButton } from "@/components/admin/ingestion/trigger-run-button";
import { Plus, Settings, Copy, MapPin, MessageSquare } from "lucide-react";
import type { EventSource, IngestionRun, DedupMatch } from "@/types";

export default async function IngestionDashboardPage() {
  const supabase = await createClient();

  const [
    { data: sources },
    { data: runs },
    { data: pendingDedups },
    { data: recentErrorRuns },
  ] = await Promise.all([
    supabase
      .from("event_sources")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("ingestion_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(20),
    supabase
      .from("dedup_matches")
      .select("id")
      .eq("status", "pending"),
    supabase
      .from("ingestion_runs")
      .select("id")
      .eq("status", "failed")
      .gte("started_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const allSources = (sources ?? []) as EventSource[];
  const allRuns = (runs ?? []) as IngestionRun[];
  const activeSources = allSources.filter((s) => s.is_enabled).length;
  const totalEventsIngested = allSources.reduce((sum, s) => sum + (s.events_ingested_count || 0), 0);

  const sourceNames: Record<string, string> = {};
  for (const s of allSources) {
    sourceNames[s.id] = s.name;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Event Ingestion</h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/ingestion/venues">
              <MapPin className="mr-2 h-4 w-4" />
              Venues
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/ingestion/dedup-review">
              <Copy className="mr-2 h-4 w-4" />
              Dedup Queue ({(pendingDedups ?? []).length})
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/ingestion/messages">
              <MessageSquare className="mr-2 h-4 w-4" />
              Messages
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/ingestion/sources/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Source
            </Link>
          </Button>
        </div>
      </div>

      <IngestionStats
        totalSources={allSources.length}
        activeSources={activeSources}
        totalEventsIngested={totalEventsIngested}
        pendingDedup={(pendingDedups ?? []).length}
        recentErrors={(recentErrorRuns ?? []).length}
      />

      {allSources.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Sources</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/ingestion/sources">
                <Settings className="mr-2 h-4 w-4" />
                Manage Sources
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {allSources.map((source) => (
              <div key={source.id} className="space-y-2">
                <SourceHealthCard source={source} />
                <TriggerRunButton sourceId={source.id} sourceName={source.name} />
              </div>
            ))}
          </div>
        </div>
      )}

      {allSources.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <CardTitle className="mt-4 text-lg">No sources configured</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first event source to start ingesting events.
            </p>
            <Button asChild className="mt-4">
              <Link href="/admin/ingestion/sources/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Source
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold">Recent Runs</h2>
        <Card>
          <CardContent className="pt-6">
            <RunHistoryTable runs={allRuns} sourceNames={sourceNames} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
