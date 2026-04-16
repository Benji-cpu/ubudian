import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Globe,
  Users,
} from "lucide-react";
import { MobileCardField } from "@/components/admin/mobile-card-field";
import { CreateSourceButton } from "@/components/admin/ingestion/create-source-button";
import { TelegramRegisterButton } from "@/components/admin/ingestion/telegram-register-button";
import { formatDistanceToNow } from "date-fns";
import type { EventSource, RawIngestionMessage } from "@/types";

function EnvBadge({ name, isSet }: { name: string; isSet: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="font-mono text-muted-foreground">{name}</span>
      {isSet ? (
        <Badge variant="default" className="bg-green-600 text-xs">set</Badge>
      ) : (
        <Badge variant="destructive" className="text-xs">not set</Badge>
      )}
    </div>
  );
}

export default async function TelegramIngestionPage() {
  const supabase = await createClient();

  // Check env vars (existence only, never values)
  const hasBotToken = !!process.env.TELEGRAM_BOT_TOKEN;
  const hasWebhookSecret = !!process.env.TELEGRAM_WEBHOOK_SECRET;
  const hasSiteUrl = !!process.env.NEXT_PUBLIC_SITE_URL;
  const webhookUrl = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/telegram`
    : "(NEXT_PUBLIC_SITE_URL not set)";
  const isLocalhost = !process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://");

  // Fetch Telegram event source
  const { data: sourceData } = await supabase
    .from("event_sources")
    .select("*")
    .eq("source_type", "telegram")
    .maybeSingle();

  const source = sourceData as EventSource | null;

  // Fetch stats and messages (only if source exists)
  const [
    { count: totalMessages },
    { count: parsedCount },
    { count: notEventCount },
    { count: failedCount },
    { data: messagesData },
    { data: lastMessageData },
  ] = await Promise.all([
    source
      ? supabase
          .from("raw_ingestion_messages")
          .select("*", { count: "exact", head: true })
          .eq("source_id", source.id)
      : Promise.resolve({ count: 0, data: null, error: null }),
    source
      ? supabase
          .from("raw_ingestion_messages")
          .select("*", { count: "exact", head: true })
          .eq("source_id", source.id)
          .eq("status", "parsed")
      : Promise.resolve({ count: 0, data: null, error: null }),
    source
      ? supabase
          .from("raw_ingestion_messages")
          .select("*", { count: "exact", head: true })
          .eq("source_id", source.id)
          .eq("status", "not_event")
      : Promise.resolve({ count: 0, data: null, error: null }),
    source
      ? supabase
          .from("raw_ingestion_messages")
          .select("*", { count: "exact", head: true })
          .eq("source_id", source.id)
          .eq("status", "failed")
      : Promise.resolve({ count: 0, data: null, error: null }),
    source
      ? supabase
          .from("raw_ingestion_messages")
          .select("*")
          .eq("source_id", source.id)
          .order("created_at", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [], error: null }),
    source
      ? supabase
          .from("raw_ingestion_messages")
          .select("created_at")
          .eq("source_id", source.id)
          .order("created_at", { ascending: false })
          .limit(1)
      : Promise.resolve({ data: null, error: null }),
  ]);

  const recentMessages = (messagesData ?? []) as RawIngestionMessage[];

  // Fetch messages with chat_name for group aggregation
  const { data: groupMsgData } = source
    ? await supabase
        .from("raw_ingestion_messages")
        .select("chat_name, status, created_at")
        .eq("source_id", source.id)
        .not("chat_name", "is", null)
    : { data: [] };

  // Build group summaries
  type GroupStatus = "active" | "quiet" | "stale";
  interface GroupSummary {
    chatName: string;
    totalMessages: number;
    eventsCreated: number;
    lastMessageAt: string;
    status: GroupStatus;
  }

  const groupMap = new Map<string, { total: number; parsed: number; lastAt: string }>();
  for (const msg of groupMsgData ?? []) {
    const name = msg.chat_name as string;
    const existing = groupMap.get(name);
    const createdAt = msg.created_at as string;
    if (existing) {
      existing.total++;
      if (msg.status === "parsed") existing.parsed++;
      if (createdAt > existing.lastAt) existing.lastAt = createdAt;
    } else {
      groupMap.set(name, {
        total: 1,
        parsed: msg.status === "parsed" ? 1 : 0,
        lastAt: createdAt,
      });
    }
  }

  function getGroupStatus(lastMessageAt: string): GroupStatus {
    const hoursAgo = (Date.now() - new Date(lastMessageAt).getTime()) / (1000 * 60 * 60);
    if (hoursAgo <= 6) return "active";
    if (hoursAgo <= 24) return "quiet";
    return "stale";
  }

  const groupStatusStyles: Record<GroupStatus, string> = {
    active: "border-green-300 text-green-700 bg-green-50",
    quiet: "border-yellow-300 text-yellow-700 bg-yellow-50",
    stale: "border-red-300 text-red-700 bg-red-50",
  };

  const groups: GroupSummary[] = Array.from(groupMap.entries())
    .map(([chatName, data]) => ({
      chatName,
      totalMessages: data.total,
      eventsCreated: data.parsed,
      lastMessageAt: data.lastAt,
      status: getGroupStatus(data.lastAt),
    }))
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

  // Staleness indicator
  const lastMessageAt = lastMessageData?.[0]?.created_at as string | null;
  let stalenessColor = "text-muted-foreground";
  if (lastMessageAt) {
    const ageMs = Date.now() - new Date(lastMessageAt).getTime();
    const ageHours = ageMs / (1000 * 60 * 60);
    if (ageHours < 1) stalenessColor = "text-green-600";
    else if (ageHours < 6) stalenessColor = "text-yellow-600";
    else stalenessColor = "text-red-600";
  }

  function statusBadgeVariant(status: string) {
    if (status === "parsed") return "default";
    if (status === "failed") return "destructive";
    return "secondary";
  }

  // Extract group title from Telegram raw_data
  function getGroupTitle(rawData: unknown): string {
    const data = rawData as { message?: { chat?: { title?: string } }; channel_post?: { chat?: { title?: string } } } | null;
    return data?.message?.chat?.title || data?.channel_post?.chat?.title || "—";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/ingestion">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Telegram Ingestion</h1>
      </div>

      {/* Webhook Setup Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4" />
            Webhook Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Webhook URL</p>
            <code className="mt-1 block rounded bg-muted px-2 py-1 text-xs">
              {webhookUrl}
            </code>
          </div>
          <div className="flex flex-wrap gap-4">
            <EnvBadge name="TELEGRAM_BOT_TOKEN" isSet={hasBotToken} />
            <EnvBadge name="TELEGRAM_WEBHOOK_SECRET" isSet={hasWebhookSecret} />
            <EnvBadge name="NEXT_PUBLIC_SITE_URL" isSet={hasSiteUrl} />
          </div>
          <TelegramRegisterButton isLocalhost={isLocalhost} />
        </CardContent>
      </Card>

      {/* Source missing prompt */}
      {!source && (
        <CreateSourceButton sourceType="telegram" sourceName="Telegram" />
      )}

      {/* Staleness indicator */}
      {source && (
        <div className={`flex items-center gap-2 text-sm font-medium ${stalenessColor}`}>
          <Clock className="h-4 w-4" />
          {lastMessageAt
            ? `Last message received: ${formatDistanceToNow(new Date(lastMessageAt), { addSuffix: true })}`
            : "No messages received yet"}
        </div>
      )}

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMessages ?? 0}</div>
            <p className="text-xs text-muted-foreground">received from Telegram</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events Created</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parsedCount ?? 0}</div>
            <p className="text-xs text-muted-foreground">status = parsed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Not Events</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notEventCount ?? 0}</div>
            <p className="text-xs text-muted-foreground">classified as non-events</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedCount ?? 0}</div>
            <p className="text-xs text-muted-foreground">failed to process</p>
          </CardContent>
        </Card>
      </div>

      {/* Groups */}
      {source && (
        <div>
          <h2 className="mb-3 text-lg font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            Groups ({groups.length})
          </h2>
          <Card>
            <CardContent className="pt-6">
              {groups.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No group messages received yet. Add the bot to Telegram groups to start ingesting events.
                </p>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Group</TableHead>
                          <TableHead className="text-center">Messages</TableHead>
                          <TableHead className="text-center">Events Created</TableHead>
                          <TableHead>Last Active</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groups.map((group) => (
                          <TableRow key={group.chatName}>
                            <TableCell className="font-medium max-w-[200px] truncate" title={group.chatName}>
                              {group.chatName}
                            </TableCell>
                            <TableCell className="text-center tabular-nums">
                              {group.totalMessages}
                            </TableCell>
                            <TableCell className="text-center tabular-nums">
                              {group.eventsCreated}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(group.lastMessageAt), { addSuffix: true })}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-xs capitalize ${groupStatusStyles[group.status]}`}>
                                {group.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile cards */}
                  <div className="space-y-3 md:hidden">
                    {groups.map((group) => (
                      <div key={group.chatName} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm truncate" title={group.chatName}>
                            {group.chatName}
                          </span>
                          <Badge variant="outline" className={`text-xs capitalize shrink-0 ${groupStatusStyles[group.status]}`}>
                            {group.status}
                          </Badge>
                        </div>
                        <dl className="mt-2 grid grid-cols-2 gap-2">
                          <MobileCardField label="Messages">{group.totalMessages}</MobileCardField>
                          <MobileCardField label="Events">{group.eventsCreated}</MobileCardField>
                          <MobileCardField label="Last Active">
                            {formatDistanceToNow(new Date(group.lastMessageAt), { addSuffix: true })}
                          </MobileCardField>
                        </dl>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent messages */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Recent Messages</h2>
        <Card>
          <CardContent className="pt-6">
            {recentMessages.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No messages yet.</p>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sender</TableHead>
                        <TableHead>Group</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentMessages.map((msg) => (
                        <TableRow key={msg.id}>
                          <TableCell className="text-muted-foreground">
                            {msg.sender_name ?? "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {getGroupTitle(msg.raw_data)}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {msg.content_text
                              ? msg.content_text.slice(0, 80) +
                                (msg.content_text.length > 80 ? "..." : "")
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusBadgeVariant(msg.status)}>
                              {msg.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {new Date(msg.created_at).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile cards */}
                <div className="space-y-3 md:hidden">
                  {recentMessages.map((msg) => (
                    <div key={msg.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-medium">
                          {msg.sender_name ?? "—"}
                        </span>
                        <Badge variant={statusBadgeVariant(msg.status)}>
                          {msg.status}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {getGroupTitle(msg.raw_data)}
                      </p>
                      <p className="mt-1 truncate text-sm">
                        {msg.content_text
                          ? msg.content_text.slice(0, 80) +
                            (msg.content_text.length > 80 ? "..." : "")
                          : "—"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(msg.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
