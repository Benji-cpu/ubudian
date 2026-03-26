import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MobileCardField } from "@/components/admin/mobile-card-field";
import { SourceConfigPanel } from "@/components/admin/ingestion/source-config-panel";
import { RunHistoryTable } from "@/components/admin/ingestion/run-history-table";
import { TriggerRunButton } from "@/components/admin/ingestion/trigger-run-button";
import { ArrowLeft, Pencil, WifiOff } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import type { EventSource, IngestionRun } from "@/types";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  approved: "default",
  rejected: "destructive",
  archived: "secondary",
};

export default async function SourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: source },
    { data: runs },
    { data: recentEvents },
    { data: allEvents },
  ] = await Promise.all([
    supabase.from("event_sources").select("*").eq("id", id).single(),
    supabase
      .from("ingestion_runs")
      .select("*")
      .eq("source_id", id)
      .order("started_at", { ascending: false })
      .limit(10),
    supabase
      .from("events")
      .select("id, title, slug, category, status, venue_name, start_date, quality_score")
      .eq("source_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("events")
      .select("category, status")
      .eq("source_id", id),
  ]);

  if (!source) notFound();

  const typedSource = source as EventSource;
  const typedRuns = (runs ?? []) as IngestionRun[];
  const typedRecentEvents = (recentEvents ?? []) as {
    id: string;
    title: string;
    slug: string;
    category: string;
    status: string;
    venue_name: string | null;
    start_date: string;
    quality_score: number | null;
  }[];
  const typedAllEvents = (allEvents ?? []) as { category: string; status: string }[];

  // Compute stats
  const totalEvents = typedAllEvents.length;
  const pendingCount = typedAllEvents.filter((e) => e.status === "pending").length;
  const approvedCount = typedAllEvents.filter((e) => e.status === "approved").length;
  const lastRunAt = typedRuns[0]?.started_at ?? null;
  const completedRuns = typedRuns.filter((r) => r.status === "completed").length;
  const totalRuns = typedRuns.length;
  const successRate = totalRuns > 0 ? Math.round((completedRuns / totalRuns) * 100) : -1;

  // Category breakdown
  const categoryMap = new Map<string, { total: number; approved: number; pending: number }>();
  for (const event of typedAllEvents) {
    const cat = event.category || "Uncategorized";
    const entry = categoryMap.get(cat) ?? { total: 0, approved: 0, pending: 0 };
    entry.total++;
    if (event.status === "approved") entry.approved++;
    if (event.status === "pending") entry.pending++;
    categoryMap.set(cat, entry);
  }
  const categories = Array.from(categoryMap.entries())
    .map(([name, counts]) => ({ name, ...counts }))
    .sort((a, b) => b.total - a.total);

  const sourceNames: Record<string, string> = { [typedSource.id]: typedSource.name };

  return (
    <div className="space-y-6">
      {/* Back link + Header */}
      <div>
        <Link
          href="/admin/ingestion/sources"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Sources
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold sm:text-3xl">{typedSource.name}</h1>
            <Badge variant="outline">{typedSource.source_type}</Badge>
            <Badge variant={typedSource.is_enabled ? "default" : "secondary"}>
              {typedSource.is_enabled ? "Active" : "Disabled"}
            </Badge>
            {typedSource.auto_approve_enabled && (
              <Badge variant="secondary">Auto-approve</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <TriggerRunButton sourceId={typedSource.id} sourceName={typedSource.name} />
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/ingestion/sources/${typedSource.id}/edit`}>
                <Pencil className="mr-1 h-3 w-3" />
                Edit
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {typedSource.last_error && (
        <Card className="border-red-300 dark:border-red-800">
          <CardContent className="flex items-start gap-2 pt-4">
            <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-300">Last Error</p>
              <p className="text-sm text-red-600 dark:text-red-400">{typedSource.last_error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total Events</p>
            <p className="text-2xl font-bold">{totalEvents}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Approved</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">{approvedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Last Run</p>
            <p className="text-lg font-semibold">
              {lastRunAt
                ? formatDistanceToNow(new Date(lastRunAt), { addSuffix: true })
                : "Never"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Run Success Rate</p>
            <p className="text-2xl font-bold">
              {successRate >= 0 ? `${successRate}%` : "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Config panel */}
      <SourceConfigPanel config={typedSource.config} />

      {/* Category breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events ingested yet.</p>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => (
                <div
                  key={cat.name}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <span className="text-sm font-medium">{cat.name}</span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">{cat.total} total</span>
                    <Badge variant="default" className="text-xs">{cat.approved} approved</Badge>
                    {cat.pending > 0 && (
                      <Badge variant="outline" className="text-xs">{cat.pending} pending</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          {typedRecentEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events ingested yet.</p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Venue</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Quality</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {typedRecentEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium max-w-[250px] truncate">
                          <Link
                            href={`/admin/events/${event.id}/edit`}
                            className="hover:underline"
                          >
                            {event.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{event.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[event.status] ?? "outline"}>
                            {event.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[150px] truncate">
                          {event.venue_name ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {format(new Date(event.start_date), "d MMM yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          {event.quality_score !== null ? (
                            <span className="font-medium">{event.quality_score}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {typedRecentEvents.map((event) => (
                  <div key={event.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/admin/events/${event.id}/edit`}
                        className="text-sm font-medium hover:underline line-clamp-2"
                      >
                        {event.title}
                      </Link>
                      <Badge variant={statusVariant[event.status] ?? "outline"}>
                        {event.status}
                      </Badge>
                    </div>
                    <dl className="mt-2 grid grid-cols-2 gap-2">
                      <MobileCardField label="Category">
                        {event.category}
                      </MobileCardField>
                      <MobileCardField label="Date">
                        {format(new Date(event.start_date), "d MMM yyyy")}
                      </MobileCardField>
                      <MobileCardField label="Venue">
                        {event.venue_name ?? "—"}
                      </MobileCardField>
                      <MobileCardField label="Quality">
                        {event.quality_score !== null ? String(event.quality_score) : "—"}
                      </MobileCardField>
                    </dl>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Run history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Run History</CardTitle>
        </CardHeader>
        <CardContent>
          <RunHistoryTable runs={typedRuns} sourceNames={sourceNames} />
        </CardContent>
      </Card>
    </div>
  );
}
