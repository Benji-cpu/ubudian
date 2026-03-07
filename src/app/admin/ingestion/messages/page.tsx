import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { RawMessageCard } from "@/components/admin/ingestion/raw-message-card";
import type { RawIngestionMessage, EventSource } from "@/types";

export default async function RawMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; source?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // Build query
  let query = supabase
    .from("raw_ingestion_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (params.status) {
    query = query.eq("status", params.status);
  }
  if (params.source) {
    query = query.eq("source_id", params.source);
  }

  const [{ data: messages }, { data: sources }] = await Promise.all([
    query,
    supabase.from("event_sources").select("id, name"),
  ]);

  const allMessages = (messages ?? []) as RawIngestionMessage[];
  const sourceNames: Record<string, string> = {};
  for (const s of (sources ?? []) as EventSource[]) {
    sourceNames[s.id] = s.name;
  }

  const statuses = ["pending", "parsed", "not_event", "failed", "duplicate"];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/ingestion">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Raw Messages</h1>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/admin/ingestion/messages"
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            !params.status ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
          }`}
        >
          All
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/admin/ingestion/messages?status=${s}`}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
              params.status === s ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      {allMessages.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No messages found.
        </div>
      ) : (
        <div className="space-y-4">
          {allMessages.map((msg) => (
            <RawMessageCard
              key={msg.id}
              message={msg}
              sourceName={sourceNames[msg.source_id] || "Unknown"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
