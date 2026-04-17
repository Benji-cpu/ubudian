"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PipelineHealthLog } from "@/types";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  ScrollText,
} from "lucide-react";

interface HealthLogProps {
  logs: PipelineHealthLog[];
}

const LOG_TYPE_CONFIG: Record<
  string,
  { icon: React.ReactNode; color: string }
> = {
  success: {
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    color: "text-green-600",
  },
  warning: {
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    color: "text-amber-600",
  },
  error: {
    icon: <XCircle className="h-3.5 w-3.5" />,
    color: "text-red-600",
  },
  info: {
    icon: <Info className="h-3.5 w-3.5" />,
    color: "text-blue-600",
  },
};

const CHANNEL_COLORS: Record<string, string> = {
  telegram: "bg-blue-100 text-blue-700 border-blue-200",
  whatsapp: "bg-green-100 text-green-700 border-green-200",
  megatix: "bg-purple-100 text-purple-700 border-purple-200",
  system: "bg-gray-100 text-gray-700 border-gray-200",
};

export function HealthLog({ logs }: HealthLogProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ScrollText className="h-4 w-4" />
          Health Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No health logs yet.
          </p>
        ) : (
          <div className="space-y-0">
            {logs.slice(0, 20).map((log, i) => {
              const config = LOG_TYPE_CONFIG[log.log_type] || LOG_TYPE_CONFIG.info;
              const isLast = i === Math.min(logs.length, 20) - 1;

              return (
                <div
                  key={log.id}
                  className={cn(
                    "flex items-start gap-3 py-2.5",
                    !isLast && "border-b border-border/50"
                  )}
                >
                  {/* Icon */}
                  <span className={cn("mt-0.5 shrink-0", config.color)}>
                    {config.icon}
                  </span>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {log.channel && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-1.5 py-0 capitalize",
                            CHANNEL_COLORS[log.channel] || CHANNEL_COLORS.system
                          )}
                        >
                          {log.channel}
                        </Badge>
                      )}
                      {log.group_name && (
                        <span className="text-xs text-muted-foreground">
                          {log.group_name}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm leading-snug">
                      {log.message}
                    </p>
                  </div>

                  {/* Timestamp */}
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(log.created_at), {
                      addSuffix: false,
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
