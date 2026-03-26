"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, ChevronDown, ChevronUp, Loader2, Bot } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PendingEvent {
  id: string;
  title: string;
  category: string;
  start_date: string;
  venue_name: string | null;
  source_id: string | null;
  raw_message_id: string | null;
  llm_parsed: boolean;
  quality_score: number | null;
  content_flags: string[] | null;
  created_at: string;
  raw_ingestion_messages?: { chat_name: string | null } | { chat_name: string | null }[] | null;
}

function getChatName(event: PendingEvent): string | null {
  const raw = event.raw_ingestion_messages;
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0]?.chat_name ?? null;
  return raw.chat_name;
}

export function PendingApprovalQueue({ events }: { events: PendingEvent[] }) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [originalText, setOriginalText] = useState<Record<string, string>>({});
  const [loadingText, setLoadingText] = useState<string | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  async function toggleExpand(eventId: string, rawMessageId: string | null) {
    if (expandedId === eventId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(eventId);

    if (rawMessageId && !originalText[eventId]) {
      setLoadingText(eventId);
      try {
        const res = await fetch(`/api/admin/ingestion/messages/${rawMessageId}`);
        if (res.ok) {
          const data = await res.json();
          setOriginalText((prev) => ({
            ...prev,
            [eventId]: data.content_text || "No text content",
          }));
        }
      } catch {
        setOriginalText((prev) => ({
          ...prev,
          [eventId]: "Failed to load original message",
        }));
      } finally {
        setLoadingText(null);
      }
    }
  }

  async function handleAction(eventId: string, action: "approve" | "reject") {
    setActioning(eventId);
    try {
      const res = await fetch("/api/events/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId, action }),
      });
      if (res.ok) {
        setDismissed((prev) => new Set(prev).add(eventId));
        router.refresh();
      }
    } catch (err) {
      console.error(`Failed to ${action} event:`, err);
    } finally {
      setActioning(null);
    }
  }

  const visibleEvents = events.filter((e) => !dismissed.has(e.id));

  if (visibleEvents.length === 0) return null;

  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold">
        Pending Approval ({visibleEvents.length})
      </h2>
      <div className="space-y-3">
        {visibleEvents.map((event) => (
          <Card key={event.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">
                  {event.title}
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {event.category}
                </Badge>
                {event.llm_parsed && (
                  <Badge variant="secondary" className="text-xs">
                    <Bot className="mr-1 h-3 w-3" />
                    AI
                  </Badge>
                )}
                {event.quality_score != null && (
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      event.quality_score >= 0.85
                        ? "border-green-500 text-green-700"
                        : event.quality_score >= 0.6
                          ? "border-yellow-500 text-yellow-700"
                          : "border-red-500 text-red-700"
                    }`}
                  >
                    QA: {event.quality_score.toFixed(2)}
                  </Badge>
                )}
                {event.content_flags?.map((flag) => (
                  <Badge key={flag} variant="destructive" className="text-xs">
                    {flag}
                  </Badge>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(event.created_at), {
                  addSuffix: true,
                })}
              </span>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{new Date(event.start_date).toLocaleDateString()}</span>
                {event.venue_name && <span>{event.venue_name}</span>}
                {getChatName(event) && (
                  <span className="text-xs">from {getChatName(event)}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  disabled={actioning === event.id}
                  onClick={() => handleAction(event.id, "approve")}
                >
                  {actioning === event.id ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="mr-1 h-3 w-3" />
                  )}
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={actioning === event.id}
                  onClick={() => handleAction(event.id, "reject")}
                >
                  <X className="mr-1 h-3 w-3" />
                  Reject
                </Button>
                {event.raw_message_id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      toggleExpand(event.id, event.raw_message_id)
                    }
                  >
                    {expandedId === event.id ? (
                      <ChevronUp className="mr-1 h-3 w-3" />
                    ) : (
                      <ChevronDown className="mr-1 h-3 w-3" />
                    )}
                    Original Message
                  </Button>
                )}
              </div>

              {expandedId === event.id && (
                <div className="rounded-md bg-muted p-3">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Original Message{getChatName(event) ? ` from ${getChatName(event)}` : ""}
                  </p>
                  {loadingText === event.id ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading...
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm">
                      {originalText[event.id] || "No original text available"}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
