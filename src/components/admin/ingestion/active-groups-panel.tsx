import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { Radio } from "lucide-react";
import { MobileCardField } from "@/components/admin/mobile-card-field";

export interface GroupActivity {
  chatName: string;
  sourceType: string;
  messagesLast24h: number;
  messagesPrior24h: number;
  eventsCreated: number;
  lastMessageAt: string;
}

type GroupStatus = "active" | "quiet" | "stale";

function getGroupStatus(lastMessageAt: string): GroupStatus {
  const hoursAgo = (Date.now() - new Date(lastMessageAt).getTime()) / (1000 * 60 * 60);
  if (hoursAgo <= 6) return "active";
  if (hoursAgo <= 24) return "quiet";
  return "stale";
}

const statusStyles: Record<GroupStatus, string> = {
  active:
    "border-green-300 text-green-700 bg-green-50 dark:border-green-800 dark:text-green-300 dark:bg-green-950",
  quiet:
    "border-yellow-300 text-yellow-700 bg-yellow-50 dark:border-yellow-800 dark:text-yellow-300 dark:bg-yellow-950",
  stale:
    "border-red-300 text-red-700 bg-red-50 dark:border-red-800 dark:text-red-300 dark:bg-red-950",
};

const sourceEmoji: Record<string, string> = {
  telegram: "📨",
  whatsapp: "💬",
};

export function ActiveGroupsPanel({ groups }: { groups: GroupActivity[] }) {
  const sorted = [...groups].sort((a, b) =>
    new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );

  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold flex items-center gap-2">
        <Radio className="h-4 w-4" />
        Active Groups ({groups.length})
      </h2>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Message activity from monitored groups (last 48h)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-center">Last 24h</TableHead>
                  <TableHead className="text-center">Prior 24h</TableHead>
                  <TableHead className="text-center">Events</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((group) => {
                  const status = getGroupStatus(group.lastMessageAt);
                  return (
                    <TableRow key={`${group.sourceType}-${group.chatName}`}>
                      <TableCell className="font-medium max-w-[200px] truncate" title={group.chatName}>
                        {group.chatName}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs">
                          {sourceEmoji[group.sourceType] ?? "🔗"}{" "}
                          {group.sourceType.charAt(0).toUpperCase() + group.sourceType.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        {group.messagesLast24h}
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        {group.messagesPrior24h}
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        {group.eventsCreated}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(group.lastMessageAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs capitalize ${statusStyles[status]}`}>
                          {status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {sorted.map((group) => {
              const status = getGroupStatus(group.lastMessageAt);
              return (
                <div key={`${group.sourceType}-${group.chatName}`} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm truncate" title={group.chatName}>
                      {group.chatName}
                    </span>
                    <Badge variant="outline" className={`text-xs capitalize shrink-0 ${statusStyles[status]}`}>
                      {status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {sourceEmoji[group.sourceType] ?? "🔗"}{" "}
                    {group.sourceType.charAt(0).toUpperCase() + group.sourceType.slice(1)}
                  </p>
                  <dl className="mt-2 grid grid-cols-2 gap-2">
                    <MobileCardField label="Last 24h">{group.messagesLast24h}</MobileCardField>
                    <MobileCardField label="Prior 24h">{group.messagesPrior24h}</MobileCardField>
                    <MobileCardField label="Events">{group.eventsCreated}</MobileCardField>
                    <MobileCardField label="Last Active">{formatDistanceToNow(new Date(group.lastMessageAt), { addSuffix: true })}</MobileCardField>
                  </dl>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
