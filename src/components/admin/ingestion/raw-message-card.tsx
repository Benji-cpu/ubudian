"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { RawIngestionMessage } from "@/types";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  parsed: "default",
  not_event: "outline",
  failed: "destructive",
  duplicate: "outline",
};

export function RawMessageCard({
  message,
  sourceName,
}: {
  message: RawIngestionMessage;
  sourceName: string;
}) {
  const router = useRouter();
  const [reparsing, setReparsing] = useState(false);

  async function handleReparse() {
    setReparsing(true);
    try {
      await fetch(`/api/admin/ingestion/messages/${message.id}/reparse`, {
        method: "POST",
      });
      router.refresh();
    } catch (err) {
      console.error("Reparse failed:", err);
    } finally {
      setReparsing(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {sourceName} &mdash;{" "}
          {message.sender_name || message.sender_id || "Unknown sender"}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant[message.status]}>{message.status}</Badge>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {message.content_text && (
          <p className="line-clamp-4 whitespace-pre-wrap text-sm">
            {message.content_text}
          </p>
        )}

        {message.image_urls && message.image_urls.length > 0 && (
          <div className="flex gap-2">
            {message.image_urls.map((url, i) => (
              <span key={i} className="text-xs text-blue-600 underline">
                Image {i + 1}
              </span>
            ))}
          </div>
        )}

        {message.parse_error && (
          <p className="text-xs text-red-600">Error: {message.parse_error}</p>
        )}

        {message.event_id && (
          <p className="text-xs text-green-700">
            Created event: {message.event_id.slice(0, 8)}...
          </p>
        )}

        {(message.status === "failed" || message.status === "pending") && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReparse}
            disabled={reparsing}
          >
            {reparsing ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="mr-1 h-3 w-3" />
            )}
            Re-parse
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
