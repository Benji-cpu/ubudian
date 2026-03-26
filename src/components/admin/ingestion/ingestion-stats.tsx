"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, FileText, Copy, AlertTriangle, Clock, TrendingUp, ShieldCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface IngestionStatsProps {
  totalSources: number;
  activeSources: number;
  totalEventsIngested: number;
  pendingDedup: number;
  recentErrors: number;
  lastMessageAt: string | null;
  successRate: number;
  autoApproved24h: number;
}

export function IngestionStats({
  totalSources,
  activeSources,
  totalEventsIngested,
  pendingDedup,
  recentErrors,
  lastMessageAt,
  successRate,
  autoApproved24h,
}: IngestionStatsProps) {
  // Staleness coloring — compute in useMemo to satisfy purity rules
  const now = useMemo(() => new Date(), []);
  let stalenessColor = "text-muted-foreground";
  let stalenessText = "No messages";
  if (lastMessageAt) {
    const ageMs = now.getTime() - new Date(lastMessageAt).getTime();
    const ageHours = ageMs / (1000 * 60 * 60);
    if (ageHours < 1) stalenessColor = "text-green-600";
    else if (ageHours < 6) stalenessColor = "text-yellow-600";
    else stalenessColor = "text-red-600";
    stalenessText = formatDistanceToNow(new Date(lastMessageAt), { addSuffix: true });
  }

  // Success rate coloring
  let rateColor = "text-muted-foreground";
  if (successRate >= 0) {
    if (successRate >= 70) rateColor = "text-green-600";
    else if (successRate >= 40) rateColor = "text-yellow-600";
    else rateColor = "text-red-600";
  }

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-7">
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Last Message</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stalenessColor}`}>
            {lastMessageAt ? stalenessText : "—"}
          </div>
          <p className="text-xs text-muted-foreground">
            most recent ingestion
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${rateColor}`}>
            {successRate >= 0 ? `${successRate}%` : "—"}
          </div>
          <p className="text-xs text-muted-foreground">
            parsed in last 24h
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Auto-Approved</CardTitle>
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{autoApproved24h}</div>
          <p className="text-xs text-muted-foreground">
            in last 24 hours
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
