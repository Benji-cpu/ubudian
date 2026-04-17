import { createClient } from "@/lib/supabase/server";
import { ChannelHealthCards } from "@/components/admin/dashboard/channel-health-cards";
import { MetricsRow } from "@/components/admin/dashboard/metrics-row";
import { PendingQueue } from "@/components/admin/dashboard/pending-queue";
import { HealthLog } from "@/components/admin/dashboard/health-log";
import type { PipelineHealthLog } from "@/types";
import { formatDistanceToNow } from "date-fns";

export const revalidate = 60;

export default async function AdminDashboard() {
  const supabase = await createClient();
  const now = new Date();
  const twentyFourHoursAgo = new Date(
    now.getTime() - 24 * 60 * 60 * 1000
  ).toISOString();
  const fortyEightHoursAgo = new Date(
    now.getTime() - 48 * 60 * 60 * 1000
  ).toISOString();
  const oneWeekAgo = new Date(
    now.getTime() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const [
    sourcesRes,
    recentMessagesRes,
    pendingEventsRes,
    messages24hRes,
    parsed24hRes,
    eventsThisWeekRes,
    pendingDedupRes,
    healthLogsRes,
  ] = await Promise.all([
    // Channel sources with type
    supabase
      .from("event_sources")
      .select(
        "id, name, slug, source_type, is_enabled, last_fetched_at, last_error"
      )
      .eq("is_enabled", true),
    // Recent group messages (last 48h) with chat_name
    supabase
      .from("raw_ingestion_messages")
      .select("id, source_id, chat_name, created_at")
      .gte("created_at", fortyEightHoursAgo)
      .order("created_at", { ascending: false }),
    // Pending ingested events (top 10 with source join)
    supabase
      .from("events")
      .select(
        "id, title, slug, category, venue_name, start_date, status, source_id, llm_parsed, created_at, event_sources(name, source_type)"
      )
      .eq("status", "pending")
      .not("source_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(10),
    // Messages last 24h count
    supabase
      .from("raw_ingestion_messages")
      .select("id", { count: "exact", head: true })
      .gte("created_at", twentyFourHoursAgo),
    // Parsed last 24h count
    supabase
      .from("raw_ingestion_messages")
      .select("id", { count: "exact", head: true })
      .gte("created_at", twentyFourHoursAgo)
      .eq("status", "parsed"),
    // Events this week
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .gte("created_at", oneWeekAgo),
    // Pending dedup count
    supabase
      .from("dedup_matches")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    // Health logs (last 50)
    supabase
      .from("pipeline_health_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const sources = (sourcesRes.data ?? []) as Array<{
    id: string;
    name: string;
    slug: string;
    source_type: string;
    is_enabled: boolean;
    last_fetched_at: string | null;
    last_error: string | null;
  }>;

  const recentMessages = (recentMessagesRes.data ?? []) as Array<{
    id: string;
    source_id: string;
    chat_name: string | null;
    created_at: string;
  }>;

  const pendingEvents = (pendingEventsRes.data ?? []) as Array<{
    id: string;
    title: string;
    slug: string;
    category: string;
    venue_name: string | null;
    start_date: string;
    status: string;
    source_id: string | null;
    llm_parsed: boolean;
    created_at: string;
    event_sources: { name: string; source_type: string } | null;
  }>;

  const messages24h = messages24hRes.count ?? 0;
  const parsed24h = parsed24hRes.count ?? 0;
  const eventsThisWeek = eventsThisWeekRes.count ?? 0;
  const pendingDedup = pendingDedupRes.count ?? 0;
  const healthLogs = (healthLogsRes.data ?? []) as PipelineHealthLog[];

  const lastUpdated = formatDistanceToNow(now, { addSuffix: true });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ops Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pipeline health and ingestion overview
          </p>
        </div>
        <span className="text-xs text-muted-foreground">
          Updated {lastUpdated}
        </span>
      </div>

      {/* Section 1: Channel Health Cards */}
      <ChannelHealthCards sources={sources} recentMessages={recentMessages} />

      {/* Section 2: Metrics Row */}
      <MetricsRow
        pendingCount={pendingEvents.length}
        messages24h={messages24h}
        parsed24h={parsed24h}
        eventsThisWeek={eventsThisWeek}
        pendingDedup={pendingDedup}
      />

      {/* Section 3 & 4: Pending Queue + Health Log */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PendingQueue events={pendingEvents} />
        <HealthLog logs={healthLogs} />
      </div>
    </div>
  );
}
