import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import type { IngestionActivityLog } from "@/types";

interface ActivityLogListProps {
  entries: IngestionActivityLog[];
}

const SEVERITY_CONFIG = {
  info: { icon: Info, className: "text-blue-500" },
  warning: { icon: AlertTriangle, className: "text-yellow-600" },
  error: { icon: AlertCircle, className: "text-red-500" },
} as const;

const CATEGORY_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  event_created: { label: "Event", variant: "default" },
  run_summary: { label: "Run", variant: "secondary" },
  source_error: { label: "Error", variant: "destructive" },
  source_recovered: { label: "Recovery", variant: "outline" },
  group_quiet: { label: "Quiet", variant: "outline" },
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ActivityLogList({ entries }: ActivityLogListProps) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No activity logged yet. Activity will appear here as the pipeline runs.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {entries.map((entry) => {
            const severity = SEVERITY_CONFIG[entry.severity] ?? SEVERITY_CONFIG.info;
            const category = CATEGORY_CONFIG[entry.category] ?? {
              label: entry.category,
              variant: "secondary" as const,
            };
            const SeverityIcon = severity.icon;

            return (
              <div
                key={entry.id}
                className="flex items-center gap-2 py-1.5 text-sm border-b border-border/50 last:border-0"
              >
                <SeverityIcon className={`h-4 w-4 shrink-0 ${severity.className}`} />
                <Badge variant={category.variant} className="text-xs shrink-0">
                  {category.label}
                </Badge>
                <span className="truncate flex-1" title={entry.title}>
                  {entry.title}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {timeAgo(entry.created_at)}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
