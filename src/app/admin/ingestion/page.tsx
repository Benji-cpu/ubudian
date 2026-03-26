import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { IngestionStats } from "@/components/admin/ingestion/ingestion-stats";
import { SourceHealthCard } from "@/components/admin/ingestion/source-health-card";
import { RunHistoryTable } from "@/components/admin/ingestion/run-history-table";
import { TriggerRunButton } from "@/components/admin/ingestion/trigger-run-button";
import { PendingApprovalQueue } from "@/components/admin/ingestion/pending-approval-queue";
import { ActiveGroupsPanel } from "@/components/admin/ingestion/active-groups-panel";
import type { GroupActivity } from "@/components/admin/ingestion/active-groups-panel";
import { Plus, Settings, Copy, MapPin, MessageSquare, Smartphone, Send } from "lucide-react";
import type { EventSource, IngestionRun } from "@/types";

export default async function IngestionDashboardPage() {
  const supabase = await createClient();

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

  const [
    { data: sources },
    { data: runs },
    { data: pendingDedups },
    { data: recentErrorRuns },
    { data: lastMessageData },
    { count: totalMessages24h },
    { count: parsedMessages24h },
    { data: pendingEvents },
    { count: autoApproved24h },
    { data: recentGroupMessages },
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
      .gte("started_at", twentyFourHoursAgo),
    supabase
      .from("raw_ingestion_messages")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("raw_ingestion_messages")
      .select("*", { count: "exact", head: true })
      .gte("created_at", twentyFourHoursAgo),
    supabase
      .from("raw_ingestion_messages")
      .select("*", { count: "exact", head: true })
      .eq("status", "parsed")
      .gte("created_at", twentyFourHoursAgo),
    supabase
      .from("events")
      .select("id, title, category, start_date, venue_name, source_id, raw_message_id, llm_parsed, quality_score, content_flags, created_at, raw_ingestion_messages!raw_message_id(chat_name)")
      .eq("status", "pending")
      .not("source_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved")
      .not("source_id", "is", null)
      .eq("llm_parsed", true)
      .gte("created_at", twentyFourHoursAgo),
    supabase
      .from("raw_ingestion_messages")
      .select("chat_name, source_id, status, created_at")
      .gte("created_at", fortyEightHoursAgo)
      .not("chat_name", "is", null)
      .order("created_at", { ascending: false }),
  ]);

  const allSources = (sources ?? []) as EventSource[];
  const allRuns = (runs ?? []) as IngestionRun[];
  const activeSources = allSources.filter((s) => s.is_enabled).length;
  const totalEventsIngested = allSources.reduce((sum, s) => sum + (s.events_ingested_count || 0), 0);

  const lastMessageAt = (lastMessageData?.[0]?.created_at as string) ?? null;
  const total24h = totalMessages24h ?? 0;
  const parsed24h = parsedMessages24h ?? 0;
  const successRate = total24h > 0 ? Math.round((parsed24h / total24h) * 100) : -1;

  const sourceNames: Record<string, string> = {};
  const sourceTypeMap: Record<string, string> = {};
  for (const s of allSources) {
    sourceNames[s.id] = s.name;
    sourceTypeMap[s.id] = s.source_type;
  }

  // Aggregate group activity from recent messages
  const groupMap = new Map<string, GroupActivity>();
  const twentyFourHoursAgoMs = now.getTime() - 24 * 60 * 60 * 1000;

  for (const msg of (recentGroupMessages ?? []) as { chat_name: string; source_id: string; status: string; created_at: string }[]) {
    const key = `${msg.source_id}::${msg.chat_name}`;
    let group = groupMap.get(key);
    if (!group) {
      group = {
        chatName: msg.chat_name,
        sourceType: sourceTypeMap[msg.source_id] || "unknown",
        messagesLast24h: 0,
        messagesPrior24h: 0,
        eventsCreated: 0,
        lastMessageAt: msg.created_at,
      };
      groupMap.set(key, group);
    }

    const msgTime = new Date(msg.created_at).getTime();
    if (msgTime >= twentyFourHoursAgoMs) {
      group.messagesLast24h++;
    } else {
      group.messagesPrior24h++;
    }

    if (msg.status === "parsed") {
      group.eventsCreated++;
    }

    // lastMessageAt is the most recent (messages are ordered desc)
    if (msg.created_at > group.lastMessageAt) {
      group.lastMessageAt = msg.created_at;
    }
  }

  const groupActivity = Array.from(groupMap.values());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Event Ingestion</h1>
        <Button asChild>
          <Link href="/admin/ingestion/sources/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Source
          </Link>
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 mt-4">
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
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/ingestion/whatsapp">
            <Smartphone className="mr-2 h-4 w-4" />
            WhatsApp
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/ingestion/telegram">
            <Send className="mr-2 h-4 w-4" />
            Telegram
          </Link>
        </Button>
      </div>

      <IngestionStats
        totalSources={allSources.length}
        activeSources={activeSources}
        totalEventsIngested={totalEventsIngested}
        pendingDedup={(pendingDedups ?? []).length}
        recentErrors={(recentErrorRuns ?? []).length}
        lastMessageAt={lastMessageAt}
        successRate={successRate}
        autoApproved24h={autoApproved24h ?? 0}
      />

      {groupActivity.length > 0 && (
        <ActiveGroupsPanel groups={groupActivity} />
      )}

      {(pendingEvents ?? []).length > 0 && (
        <PendingApprovalQueue events={pendingEvents ?? []} sourceNames={sourceNames} />
      )}

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
                <Link href={`/admin/ingestion/sources/${source.id}`}>
                  <SourceHealthCard source={source} />
                </Link>
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
