"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Phone, Globe } from "lucide-react";

interface ChannelHealthCardsProps {
  sources: Array<{
    id: string;
    name: string;
    source_type: string;
    is_enabled: boolean;
    last_fetched_at: string | null;
    last_error: string | null;
  }>;
  recentMessages: Array<{
    id: string;
    source_id: string;
    chat_name: string | null;
    created_at: string;
  }>;
}

type ChannelStatus = "healthy" | "warning" | "error";

interface ChannelConfig {
  label: string;
  types: string[];
  icon: React.ReactNode;
  color: string;
  /** Latest message younger than this is healthy; younger than warnHours, a warning. */
  healthyHours: number;
  warnHours: number;
}

// Thresholds follow each channel's real cadence. The groups post a few times a
// day and the harvests land once a night, so the old 3h/12h rule showed both
// red for most of every day while they were working.
const CHANNELS: ChannelConfig[] = [
  {
    label: "Telegram",
    types: ["telegram"],
    icon: <MessageSquare className="h-4 w-4" />,
    color: "text-blue-600",
    healthyHours: 24,
    warnHours: 48,
  },
  {
    // Dropped 2026-09-27 (Ben). The card only appears if the row is switched
    // back on or messages arrive, so a switched-off channel never reads "Error".
    label: "WhatsApp",
    types: ["whatsapp"],
    icon: <Phone className="h-4 w-4" />,
    color: "text-green-600",
    healthyHours: 24,
    warnHours: 48,
  },
  {
    label: "Harvests",
    types: ["scraper", "api"],
    icon: <Globe className="h-4 w-4" />,
    color: "text-purple-600",
    healthyHours: 26,
    warnHours: 48,
  },
];

function getRecencyColor(date: Date, channel: ChannelConfig): string {
  const hoursAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60);
  if (hoursAgo < channel.healthyHours) return "text-green-600";
  if (hoursAgo < channel.warnHours) return "text-amber-600";
  return "text-red-600";
}

function getChannelStatus(
  channel: ChannelConfig,
  channelMessages: Array<{ source_id: string; created_at: string }>
): ChannelStatus {
  if (channelMessages.length === 0) return "error";

  const latestMessage = channelMessages[0]; // Already sorted desc
  const hoursAgo =
    (Date.now() - new Date(latestMessage.created_at).getTime()) /
    (1000 * 60 * 60);

  if (hoursAgo < channel.healthyHours) return "healthy";
  if (hoursAgo < channel.warnHours) return "warning";
  return "error";
}

const STATUS_CONFIG: Record<
  ChannelStatus,
  { label: string; dotClass: string; badgeClass: string }
> = {
  healthy: {
    label: "Healthy",
    dotClass: "bg-green-500",
    badgeClass: "bg-green-100 text-green-700 border-green-200",
  },
  warning: {
    label: "Warning",
    dotClass: "bg-amber-500",
    badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
  },
  error: {
    label: "Error",
    dotClass: "bg-red-500",
    badgeClass: "bg-red-100 text-red-700 border-red-200",
  },
};

export function ChannelHealthCards({
  sources,
  recentMessages,
}: ChannelHealthCardsProps) {
  const now = new Date();
  const twentyFourHoursAgo = new Date(
    now.getTime() - 24 * 60 * 60 * 1000
  );

  // A channel is shown when one of its rows is on or it has recent messages.
  // The harvest rows are off by design and still deliver; WhatsApp is off and
  // silent, so it drops out instead of sitting on the dashboard as a failure.
  const shown = CHANNELS.map((channel) => {
    const channelSources = sources.filter((s) =>
      channel.types.includes(s.source_type)
    );
    const sourceIds = channelSources.map((s) => s.id);
    const channelMessages = recentMessages.filter((m) =>
      sourceIds.includes(m.source_id)
    );
    return { channel, channelSources, channelMessages };
  }).filter(
    ({ channelSources, channelMessages }) =>
      channelSources.some((s) => s.is_enabled) || channelMessages.length > 0
  );

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {shown.map(({ channel, channelMessages }) => {
        const messagesLast24h = channelMessages.filter(
          (m) => new Date(m.created_at) >= twentyFourHoursAgo
        );

        const status = getChannelStatus(channel, channelMessages);
        const statusConfig = STATUS_CONFIG[status];

        // Group by chat_name
        const groupMap = new Map<
          string,
          { name: string; lastMessage: Date }
        >();
        for (const msg of channelMessages) {
          const groupName = msg.chat_name || "Nightly harvest";
          const existing = groupMap.get(groupName);
          const msgDate = new Date(msg.created_at);
          if (!existing || msgDate > existing.lastMessage) {
            groupMap.set(groupName, { name: groupName, lastMessage: msgDate });
          }
        }
        const groups = Array.from(groupMap.values()).sort(
          (a, b) => b.lastMessage.getTime() - a.lastMessage.getTime()
        );

        return (
          <Card key={channel.label} className="gap-4 py-4">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <span className={channel.color}>{channel.icon}</span>
                  {channel.label}
                </CardTitle>
                <Badge
                  variant="outline"
                  className={cn("text-xs", statusConfig.badgeClass)}
                >
                  <span
                    className={cn(
                      "mr-1 inline-block h-1.5 w-1.5 rounded-full",
                      statusConfig.dotClass
                    )}
                  />
                  {statusConfig.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-2xl font-bold tabular-nums">
                {messagesLast24h.length}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  today
                </span>
              </p>

              {groups.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No recent activity
                </p>
              ) : (
                <div className="space-y-1.5">
                  {groups.slice(0, 5).map((group) => (
                    <div
                      key={group.name}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="truncate font-medium">
                        {group.name}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 ml-2",
                          getRecencyColor(group.lastMessage, channel)
                        )}
                      >
                        {formatDistanceToNow(group.lastMessage, {
                          addSuffix: false,
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
