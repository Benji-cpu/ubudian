"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Loader2 } from "lucide-react";

export function TriggerRunButton({ sourceId, sourceName }: { sourceId: string; sourceName: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleTrigger() {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/ingestion/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId }),
      });

      const data = await res.json();

      if (data.status === "completed") {
        setResult(
          `Done: ${data.eventsCreated} created, ${data.duplicatesFound} dupes, ${data.errorsCount} errors`
        );
      } else {
        setResult(`Failed: ${data.errors?.[0]?.error || "Unknown error"}`);
      }
    } catch (err) {
      setResult("Error triggering ingestion run");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleTrigger}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        ) : (
          <Play className="mr-1 h-3 w-3" />
        )}
        Run
      </Button>
      {result && (
        <span className="text-xs text-muted-foreground">{result}</span>
      )}
    </div>
  );
}
