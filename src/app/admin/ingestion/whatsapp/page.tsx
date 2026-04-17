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
import { ArrowLeft, MessageSquare, CheckCircle, XCircle, AlertTriangle, Clock, Globe } from "lucide-react";
import { WhatsAppGroupList } from "@/components/admin/ingestion/whatsapp-group-list";
import { CreateSourceButton } from "@/components/admin/ingestion/create-source-button";
import { TriggerRunButton } from "@/components/admin/ingestion/trigger-run-button";
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

interface WahaChat {
  id: string | { _serialized: string; [key: string]: unknown };
  name: string;
}

export default async function WhatsAppIngestionPage() {
  const supabase = await createClient();

  // Check env vars (existence only, never values)
  const hasWebhookSecret = !!process.env.WAHA_WEBHOOK_SECRET;
  const hasApiKey = !!process.env.WAHA_API_KEY;
  const hasApiUrl = !!process.env.WAHA_API_URL;
  const webhookUrl = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/whatsapp`
    : "(NEXT_PUBLIC_SITE_URL not set)";

  // Fetch WhatsApp event source
  const { data: sourceData } = await supabase
    .from("event_sources")
    .select("*")
    .eq("source_type", "whatsapp")
    .maybeSingle();

  const source = sourceData as EventSource | null;

  // Fetch message counts by status (only if source exists)
  const [
    { count: totalMessages },
    { count: parsedCount },
    { count: notEventCount },
    { count: failedCount },
    { data: messagesData },
    { data: lastMessageData },
    { data: allMsgData },
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
    source
      ? supabase
          .from("raw_ingestion_messages")
          .select("raw_data")
          .eq("source_id", source.id)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const recentMessages = (messagesData ?? []) as RawIngestionMessage[];

  // Fetch WhatsApp groups from WAHA
  const wahaApiUrl = process.env.WAHA_API_URL;
  const wahaApiKey = process.env.WAHA_API_KEY;
  let groups: { id: string; name: string }[] = [];

  if (wahaApiUrl && wahaApiKey) {
    try {
      const res = await fetch(`${wahaApiUrl}/api/default/chats`, {
        headers: { "X-Api-Key": wahaApiKey },
        cache: "no-store",
      });
      if (res.ok) {
        const chats = (await res.json()) as WahaChat[];
        groups = chats
          .filter((c) => {
            const id = typeof c.id === "object" ? (c.id as any)?._serialized ?? String(c.id) : String(c.id ?? "");
            return id.endsWith("@g.us");
          })
          .map((c) => {
            const id = typeof c.id === "object" ? (c.id as any)?._serialized ?? String(c.id) : String(c.id ?? "");
            return { id, name: c.name || id };
          });
      }
    } catch (err) {
      console.error("[whatsapp-admin] Failed to fetch groups from WAHA:", err);
    }
  }

  // Build per-group message counts and name lookup
  const groupMessageCounts: Record<string, number> = {};
  for (const msg of (allMsgData ?? [])) {
    const gid = (msg.raw_data as any)?.payload?.from as string | undefined;
    if (gid) groupMessageCounts[gid] = (groupMessageCounts[gid] ?? 0) + 1;
  }
  const groupNameById: Record<string, string> = {};
  for (const g of groups) groupNameById[g.id] = g.name;

  // Staleness indicator
  const lastMessageAt = lastMessageData?.[0]?.created_at as string | null;
  let stalenessColor = "text-muted-foreground";
  if (lastMessageAt) {
    const now = new Date();
    const ageMs = now.getTime() - new Date(lastMessageAt).getTime();
    const ageHours = ageMs / (1000 * 60 * 60);
    if (ageHours < 1) stalenessColor = "text-green-600";
    else if (ageHours < 6) stalenessColor = "text-yellow-600";
    else stalenessColor = "text-red-600";
  }

  const allowedGroups = (source?.config?.allowed_groups as string[] | undefined) ?? [];

  function statusBadgeVariant(status: string) {
    if (status === "parsed") return "default";
    if (status === "failed") return "destructive";
    return "secondary";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/sources">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">WhatsApp Ingestion</h1>
      </div>

      {/* Webhook Setup Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4" />
            Webhook Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Webhook URL</p>
            <code className="mt-1 block rounded bg-muted px-2 py-1 text-xs">
              {webhookUrl}
            </code>
          </div>
          <div className="flex flex-wrap gap-4">
            <EnvBadge name="WAHA_WEBHOOK_SECRET" isSet={hasWebhookSecret} />
            <EnvBadge name="WAHA_API_KEY" isSet={hasApiKey} />
            <EnvBadge name="WAHA_API_URL" isSet={hasApiUrl} />
          </div>
        </CardContent>
      </Card>

      {/* Poll Now — trigger ingestion manually */}
      {source && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Manual Poll</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <TriggerRunButton sourceId={source.id} sourceName="WhatsApp" />
            <span className="text-xs text-muted-foreground">
              Fetch recent messages from WAHA API (no webhook needed)
            </span>
          </CardContent>
        </Card>
      )}

      {/* Source missing prompt */}
      {!source && (
        <CreateSourceButton sourceType="whatsapp" sourceName="WhatsApp" />
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
            <p className="text-xs text-muted-foreground">received from WhatsApp</p>
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

      {/* Group management */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Groups</h2>
        {source ? (
          <WhatsAppGroupList
            sourceId={source.id}
            groups={groups}
            allowedGroups={allowedGroups}
            messageCounts={groupMessageCounts}
          />
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No WhatsApp event source configured.
            </CardContent>
          </Card>
        )}
      </div>

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
                            {(() => {
                              const gid = (msg.raw_data as any)?.payload?.from as string | undefined;
                              return gid ? (groupNameById[gid] ?? gid) : "—";
                            })()}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {msg.content_text
                              ? msg.content_text.slice(0, 80) +
                                (msg.content_text.length > 80 ? "…" : "")
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
                        {(() => {
                          const gid = (msg.raw_data as any)?.payload?.from as string | undefined;
                          return gid ? (groupNameById[gid] ?? gid) : "—";
                        })()}
                      </p>
                      <p className="mt-1 truncate text-sm">
                        {msg.content_text
                          ? msg.content_text.slice(0, 80) +
                            (msg.content_text.length > 80 ? "…" : "")
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
