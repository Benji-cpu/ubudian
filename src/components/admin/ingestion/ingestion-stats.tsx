"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, FileText, Copy, AlertTriangle } from "lucide-react";

interface IngestionStatsProps {
  totalSources: number;
  activeSources: number;
  totalEventsIngested: number;
  pendingDedup: number;
  recentErrors: number;
}

export function IngestionStats({
  totalSources,
  activeSources,
  totalEventsIngested,
  pendingDedup,
  recentErrors,
}: IngestionStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Sources</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeSources}</div>
          <p className="text-xs text-muted-foreground">
            of {totalSources} total sources
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Events Ingested</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalEventsIngested}</div>
          <p className="text-xs text-muted-foreground">
            total from all sources
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Dedup</CardTitle>
          <Copy className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingDedup}</div>
          <p className="text-xs text-muted-foreground">
            matches awaiting review
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Errors</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{recentErrors}</div>
          <p className="text-xs text-muted-foreground">
            in last 24 hours
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
