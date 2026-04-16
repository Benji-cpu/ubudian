"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

type GroupStatus = "active" | "quiet" | "stale";

export interface TelegramGroup {
  chatId: string;
  chatName: string;
  totalMessages: number;
  eventsCreated: number;
  lastMessageAt: string;
  status: GroupStatus;
}

interface TelegramGroupListProps {
  sourceId: string;
  groups: TelegramGroup[];
  allowedGroups: string[];
}

const groupStatusStyles: Record<GroupStatus, string> = {
  active: "border-green-300 text-green-700 bg-green-50 dark:border-green-700 dark:text-green-400 dark:bg-green-950",
  quiet: "border-yellow-300 text-yellow-700 bg-yellow-50 dark:border-yellow-700 dark:text-yellow-400 dark:bg-yellow-950",
  stale: "border-red-300 text-red-700 bg-red-50 dark:border-red-700 dark:text-red-400 dark:bg-red-950",
};

export function TelegramGroupList({ sourceId, groups, allowedGroups }: TelegramGroupListProps) {
  // Empty allowedGroups = accept all → default all toggles ON
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(allowedGroups.length === 0 ? groups.map((g) => g.chatId) : allowedGroups)
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      // If all groups are selected, store [] (accept all)
      const allSelected = groups.every((g) => selected.has(g.chatId));
      const allowedGroupsToSave = allSelected ? [] : Array.from(selected);

      const res = await fetch(`/api/admin/ingestion/sources/${sourceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: { allowed_groups: allowedGroupsToSave } }),
      });

      if (!res.ok) {
        const data = await res.json();
        setSaveError(data.error || "Failed to save");
      } else {
        setSaved(true);
      }
    } catch {
      setSaveError("Network error");
    } finally {
      setSaving(false);
    }
  };

  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No group messages received yet. Add the bot to Telegram groups to start ingesting events.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <Card key={group.chatId}>
          <CardContent className="flex items-center justify-between py-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">{group.chatName}</p>
                <Badge variant="outline" className={`text-xs capitalize shrink-0 ${groupStatusStyles[group.status]}`}>
                  {group.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-mono">{group.chatId}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {group.totalMessages} messages · {group.eventsCreated} events · last active{" "}
                {formatDistanceToNow(new Date(group.lastMessageAt), { addSuffix: true })}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-3">
              <Label htmlFor={`toggle-${group.chatId}`} className="sr-only">
                Enable {group.chatName}
              </Label>
              <Switch
                id={`toggle-${group.chatId}`}
                checked={selected.has(group.chatId)}
                onCheckedChange={() => toggle(group.chatId)}
              />
            </div>
          </CardContent>
        </Card>
      ))}
      <div className="flex items-center gap-3 pt-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving\u2026" : "Save Changes"}
        </Button>
        {saved && <span className="text-sm text-green-600">Saved!</span>}
        {saveError && <span className="text-sm text-destructive">{saveError}</span>}
      </div>
    </div>
  );
}
