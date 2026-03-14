"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw } from "lucide-react";

interface ReparseResult {
  total: number;
  results: Array<{ id: string; status: string; error?: string }>;
}

export function ReparseFailedButton({ failedCount }: { failedCount: number }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReparseResult | null>(null);

  if (failedCount === 0 && !result) return null;

  async function handleReparse() {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/ingestion/messages/reparse-failed", {
        method: "POST",
      });
      const data: ReparseResult = await res.json();
      setResult(data);
    } catch {
      setResult({ total: 0, results: [{ id: "", status: "failed", error: "Network error" }] });
    } finally {
      setLoading(false);
    }
  }

  const successCount = result?.results.filter((r) => r.status !== "failed").length ?? 0;
  const failCount = result?.results.filter((r) => r.status === "failed").length ?? 0;

  return (
    <div className="flex items-center gap-3">
      <Button size="sm" variant="outline" onClick={handleReparse} disabled={loading}>
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <RotateCcw className="mr-2 h-4 w-4" />
        )}
        Reparse All Failed ({failedCount})
      </Button>
      {result && (
        <span className="text-xs text-muted-foreground">
          {successCount} succeeded, {failCount} failed out of {result.total}
        </span>
      )}
    </div>
  );
}
