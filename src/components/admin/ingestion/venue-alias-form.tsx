"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";

export function VenueAliasForm() {
  const router = useRouter();
  const [canonicalName, setCanonicalName] = useState("");
  const [alias, setAlias] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canonicalName.trim() || !alias.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/ingestion/venues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canonical_name: canonicalName.trim(),
          alias: alias.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to add alias");
        return;
      }

      setCanonicalName("");
      setAlias("");
      router.refresh();
    } catch {
      setError("Failed to add alias");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="canonical_name" className="text-xs">
          Canonical Name
        </Label>
        <Input
          id="canonical_name"
          value={canonicalName}
          onChange={(e) => setCanonicalName(e.target.value)}
          placeholder="The Yoga Barn"
          className="w-48"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="alias" className="text-xs">
          Alias
        </Label>
        <Input
          id="alias"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          placeholder="Yoga Barn Ubud"
          className="w-48"
        />
      </div>
      <Button type="submit" size="sm" disabled={saving}>
        {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Plus className="mr-1 h-3 w-3" />}
        Add
      </Button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </form>
  );
}
