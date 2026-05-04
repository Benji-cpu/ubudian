import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SourcesTabs } from "@/components/admin/sources/sources-tabs";
import type { TelegramGroup } from "@/components/admin/ingestion/telegram-group-list";
import type { EventSource, VenueAlias, UnresolvedVenue, DedupMatch, Event } from "@/types";

interface WahaChat {
  id: string | { _serialized: string; [key: string]: unknown };
  name: string;
}

export default async function AdminSourcesPage() {
  const supabase = await createClient();

  // Parallel fetch all data needed for the three tabs
  const [
    sourcesRes,
    aliasesRes,
    unresolvedRes,
    dedupRes,
    telegramGroupMsgRes,
  ] = await Promise.all([
    supabase
      .from("event_sources")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("venue_aliases")
      .select("*")
      .order("canonical_name"),
    supabase
      .from("unresolved_venues")
      .select("*")
      .eq("status", "unresolved")
      .order("seen_count", { ascending: false }),
    supabase
      .from("dedup_matches")
      .select("*")
      .eq("status", "pending")
      .order("confidence", { ascending: false })
      .limit(20),
    // Telegram group messages for building group list
    supabase
      .from("raw_ingestion_messages")
      .select("chat_name, source_id, status, created_at, raw_data")
      .not("chat_name", "is", null),
  ]);

  const allSources = (sourcesRes.data ?? []) as EventSource[];
  const aliases = (aliasesRes.data ?? []) as VenueAlias[];
  const unresolvedVenues = (unresolvedRes.data ?? []) as UnresolvedVenue[];
  const dedupMatches = (dedupRes.data ?? []) as DedupMatch[];

  // -- Dedup: fetch referenced events --
  const eventIds = new Set<string>();
  for (const m of dedupMatches) {
    eventIds.add(m.event_a_id);
    eventIds.add(m.event_b_id);
  }

  const dedupEventsMap: Record<string, Event> = {};
  if (eventIds.size > 0) {
    const { data: events } = await supabase
      .from("events")
      .select("*")
      .in("id", Array.from(eventIds));

    for (const e of (events ?? []) as Event[]) {
      dedupEventsMap[e.id] = e;
    }
  }

  // -- Telegram: build group list from raw messages --
  const telegramSource = allSources.find((s) => s.source_type === "telegram") ?? null;
  const telegramSourceId = telegramSource?.id ?? null;

  type GroupStatus = "active" | "quiet" | "stale";

  function extractChatId(rawData: unknown): string {
    const data = rawData as { message?: { chat?: { id?: number } }; channel_post?: { chat?: { id?: number } } } | null;
    const id = data?.message?.chat?.id || data?.channel_post?.chat?.id;
    return id ? String(id) : "";
  }

  function getGroupStatus(lastMessageAt: string): GroupStatus {
    const hoursAgo = (Date.now() - new Date(lastMessageAt).getTime()) / (1000 * 60 * 60);
    if (hoursAgo <= 6) return "active";
    if (hoursAgo <= 24) return "quiet";
    return "stale";
  }

  const telegramGroupMap = new Map<string, { chatName: string; total: number; parsed: number; lastAt: string }>();
  const telegramMessages = (telegramGroupMsgRes.data ?? []) as { chat_name: string; source_id: string; status: string; created_at: string; raw_data: unknown }[];

  for (const msg of telegramMessages) {
    if (telegramSourceId && msg.source_id !== telegramSourceId) continue;
    const chatId = extractChatId(msg.raw_data);
    if (!chatId) continue;

    const existing = telegramGroupMap.get(chatId);
    if (existing) {
      existing.total++;
      if (msg.status === "parsed") existing.parsed++;
      if (msg.created_at > existing.lastAt) existing.lastAt = msg.created_at;
    } else {
      telegramGroupMap.set(chatId, {
        chatName: msg.chat_name,
        total: 1,
        parsed: msg.status === "parsed" ? 1 : 0,
        lastAt: msg.created_at,
      });
    }
  }

  const telegramGroups: TelegramGroup[] = Array.from(telegramGroupMap.entries())
    .map(([chatId, data]) => ({
      chatId,
      chatName: data.chatName,
      totalMessages: data.total,
      eventsCreated: data.parsed,
      lastMessageAt: data.lastAt,
      status: getGroupStatus(data.lastAt),
    }))
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

  const telegramConfig = (telegramSource?.config || {}) as Record<string, unknown>;
  const telegramAllowedGroups = (telegramConfig.allowed_groups as string[] | undefined) ?? [];

  // -- WhatsApp: fetch groups from WAHA API + build message counts --
  const whatsappSource = allSources.find((s) => s.source_type === "whatsapp") ?? null;
  const whatsappSourceId = whatsappSource?.id ?? null;

  let whatsappGroups: { id: string; name: string }[] = [];
  const wahaApiUrl = process.env.WAHA_API_URL;
  const wahaApiKey = process.env.WAHA_API_KEY;

  if (wahaApiUrl && wahaApiKey) {
    try {
      const res = await fetch(`${wahaApiUrl}/api/default/chats`, {
        headers: { "X-Api-Key": wahaApiKey },
        cache: "no-store",
      });
      if (res.ok) {
        const chats = (await res.json()) as WahaChat[];
        whatsappGroups = chats
          .filter((c) => {
            const id = typeof c.id === "object" ? (c.id as Record<string, unknown>)?._serialized ?? String(c.id) : String(c.id ?? "");
            return String(id).endsWith("@g.us");
          })
          .map((c) => {
            const id = typeof c.id === "object" ? (c.id as Record<string, unknown>)?._serialized ?? String(c.id) : String(c.id ?? "");
            return { id: String(id), name: c.name || String(id) };
          });
      }
    } catch (err) {
      console.error("[sources-page] Failed to fetch groups from WAHA:", err);
    }
  }

  // Build WhatsApp per-group message counts
  const whatsappMessageCounts: Record<string, number> = {};
  if (whatsappSourceId) {
    const { data: waMsgData } = await supabase
      .from("raw_ingestion_messages")
      .select("raw_data")
      .eq("source_id", whatsappSourceId);

    for (const msg of waMsgData ?? []) {
      const gid = (msg.raw_data as Record<string, unknown>)?.payload as Record<string, unknown> | undefined;
      const from = gid?.from as string | undefined;
      if (from) whatsappMessageCounts[from] = (whatsappMessageCounts[from] ?? 0) + 1;
    }
  }

  const whatsappConfig = (whatsappSource?.config || {}) as Record<string, unknown>;
  const whatsappAllowedGroups = (whatsappConfig.allowed_groups as string[] | undefined) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Sources</h1>
        <Button asChild>
          <Link href="/admin/ingestion/sources/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Source
          </Link>
        </Button>
      </div>

      <div className="mt-6">
        <SourcesTabs
          sources={allSources}
          telegramSourceId={telegramSourceId}
          telegramGroups={telegramGroups}
          telegramAllowedGroups={telegramAllowedGroups}
          whatsappSourceId={whatsappSourceId}
          whatsappGroups={whatsappGroups}
          whatsappAllowedGroups={whatsappAllowedGroups}
          whatsappMessageCounts={whatsappMessageCounts}
          aliases={aliases}
          unresolvedVenues={unresolvedVenues}
          dedupMatches={dedupMatches}
          dedupEventsMap={dedupEventsMap}
        />
      </div>
    </div>
  );
}
