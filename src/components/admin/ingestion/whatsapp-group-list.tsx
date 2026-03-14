"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface WahaGroup {
  id: string;
  name: string;
}

interface WhatsAppGroupListProps {
  sourceId: string;
  groups: WahaGroup[];
  allowedGroups: string[];
  messageCounts: Record<string, number>;
}

export function WhatsAppGroupList({ sourceId, groups, allowedGroups, messageCounts }: WhatsAppGroupListProps) {
  // Empty allowedGroups = accept all → default all toggles ON
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(allowedGroups.length === 0 ? groups.map((g) => g.id) : allowedGroups)
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
      const allSelected = groups.every((g) => selected.has(g.id));
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
          No WhatsApp groups found. Make sure WAHA is running and the phone is connected.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <Card key={group.id}>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium">{group.name}</p>
              <p className="text-xs text-muted-foreground">{group.id}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {messageCounts[group.id] ?? 0} messages received
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor={`toggle-${group.id}`} className="sr-only">
                Enable {group.name}
              </Label>
              <Switch
                id={`toggle-${group.id}`}
                checked={selected.has(group.id)}
                onCheckedChange={() => toggle(group.id)}
              />
            </div>
          </CardContent>
        </Card>
      ))}
      <div className="flex items-center gap-3 pt-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
        {saved && <span className="text-sm text-green-600">Saved!</span>}
        {saveError && <span className="text-sm text-destructive">{saveError}</span>}
      </div>
    </div>
  );
}
