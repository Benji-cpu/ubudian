"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Clock, Activity, CalendarDays, GitCompareArrows } from "lucide-react";
import Link from "next/link";

interface MetricsRowProps {
  pendingCount: number;
  messages24h: number;
  parsed24h: number;
  eventsThisWeek: number;
  pendingDedup: number;
}

interface MetricConfig {
  label: string;
  icon: React.ReactNode;
  href: string | null;
}

function getParseColor(rate: number): string {
  if (rate > 80) return "text-green-600";
  if (rate > 50) return "text-amber-600";
  return "text-red-600";
}

export function MetricsRow({
  pendingCount,
  messages24h,
  parsed24h,
  eventsThisWeek,
  pendingDedup,
}: MetricsRowProps) {
  const parseRate = messages24h > 0 ? (parsed24h / messages24h) * 100 : 0;
  const parseDisplay =
    messages24h > 0 ? `${parseRate.toFixed(0)}%` : "--";

  const metrics: (MetricConfig & { value: string | number; colorClass: string })[] = [
    {
      label: "Pending Review",
      icon: <Clock className="h-4 w-4" />,
      value: pendingCount,
      colorClass: pendingCount > 0 ? "text-amber-600" : "text-muted-foreground",
      href: "/admin/events?status=pending",
    },
    {
      label: "Parse Success",
      icon: <Activity className="h-4 w-4" />,
      value: parseDisplay,
      colorClass: messages24h > 0 ? getParseColor(parseRate) : "text-muted-foreground",
      href: null,
    },
    {
      label: "Events This Week",
      icon: <CalendarDays className="h-4 w-4" />,
      value: eventsThisWeek,
      colorClass: "text-muted-foreground",
      href: null,
    },
    {
      label: "Dedup Flags",
      icon: <GitCompareArrows className="h-4 w-4" />,
      value: pendingDedup,
      colorClass: pendingDedup > 0 ? "text-red-600" : "text-muted-foreground",
      href: "/admin/sources?tab=dedup",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {metrics.map((metric) => {
        const content = (
          <Card
            className={cn(
              "gap-2 py-4 transition-shadow",
              metric.href && "hover:shadow-md cursor-pointer"
            )}
          >
            <CardContent className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {metric.label}
                </p>
                <p
                  className={cn(
                    "mt-1 text-2xl font-bold tabular-nums",
                    metric.colorClass
                  )}
                >
                  {metric.value}
                </p>
              </div>
              <span className="text-muted-foreground">{metric.icon}</span>
            </CardContent>
          </Card>
        );

        if (metric.href) {
          return (
            <Link key={metric.label} href={metric.href}>
              {content}
            </Link>
          );
        }

        return <div key={metric.label}>{content}</div>;
      })}
    </div>
  );
}
