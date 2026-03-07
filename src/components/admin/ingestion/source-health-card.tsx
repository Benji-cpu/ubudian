"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle, XCircle, Clock, Wifi, WifiOff } from "lucide-react";
import type { EventSource } from "@/types";

export function SourceHealthCard({ source }: { source: EventSource }) {
  const isHealthy = !source.last_error && source.last_success_at;
  const lastRun = source.last_fetched_at
    ? formatDistanceToNow(new Date(source.last_fetched_at), { addSuffix: true })
    : "Never";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{source.name}</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={source.is_enabled ? "default" : "secondary"}>
            {source.is_enabled ? "Active" : "Disabled"}
          </Badge>
          {isHealthy ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : source.last_error ? (
            <XCircle className="h-4 w-4 text-red-500" />
          ) : (
            <Clock className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Type</span>
            <Badge variant="outline">{source.source_type}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Last Run</span>
            <span>{lastRun}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Events Ingested</span>
            <span className="font-medium">{source.events_ingested_count}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Interval</span>
            <span>{source.fetch_interval_minutes}m</span>
          </div>
          {source.last_error && (
            <div className="mt-2 flex items-start gap-1 rounded-md bg-red-50 p-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
              <WifiOff className="mt-0.5 h-3 w-3 shrink-0" />
              <span className="line-clamp-2">{source.last_error}</span>
            </div>
          )}
          {!source.last_error && source.last_success_at && (
            <div className="mt-2 flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
              <Wifi className="h-3 w-3" />
              <span>
                Healthy — last success{" "}
                {formatDistanceToNow(new Date(source.last_success_at), { addSuffix: true })}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
