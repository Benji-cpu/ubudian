"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Plus, Loader2 } from "lucide-react";
import type { SourceType } from "@/types";

interface CreateSourceButtonProps {
  sourceType: SourceType;
  sourceName: string;
}

export function CreateSourceButton({ sourceType, sourceName }: CreateSourceButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/ingestion/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sourceName,
          source_type: sourceType,
          is_enabled: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create source");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create source");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-yellow-300 bg-yellow-50">
      <CardContent className="flex items-center gap-4 py-4">
        <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-yellow-800">
            No {sourceName} event source found
          </p>
          <p className="text-xs text-yellow-700">
            The webhook is working, but messages will be silently dropped until a source row exists.
          </p>
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
        <Button size="sm" onClick={handleCreate} disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Create Source
        </Button>
      </CardContent>
    </Card>
  );
}
