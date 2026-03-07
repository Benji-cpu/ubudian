"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X, Loader2 } from "lucide-react";

interface UnresolvedVenueActionsProps {
  venueId: string;
  rawName: string;
}

export function UnresolvedVenueActions({ venueId, rawName }: UnresolvedVenueActionsProps) {
  const router = useRouter();
  const [canonicalName, setCanonicalName] = useState(rawName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAction(action: "resolve" | "ignore") {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/ingestion/venues/unresolved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: venueId,
          action,
          ...(action === "resolve" ? { canonical_name: canonicalName.trim() } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || `Failed to ${action}`);
        return;
      }

      router.refresh();
    } catch {
      setError(`Failed to ${action}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={canonicalName}
        onChange={(e) => setCanonicalName(e.target.value)}
        placeholder="Canonical name"
        className="h-8 w-44 text-sm"
        disabled={loading}
      />
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleAction("resolve")}
        disabled={loading || !canonicalName.trim()}
        title="Resolve — create alias mapping"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => handleAction("ignore")}
        disabled={loading}
        title="Ignore — hide from list"
      >
        <X className="h-3 w-3" />
      </Button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
