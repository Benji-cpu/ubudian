"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ImageIcon, Loader2 } from "lucide-react";

interface BackfillResult {
  scanned: number;
  enriched: number;
  failed: number;
  skipped: number;
  dryRun: boolean;
  error?: string;
}

export function BackfillImagesButton() {
  const router = useRouter();
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    const id = toast.loading("Scraping event URLs for missing images…");
    try {
      const res = await fetch("/api/admin/events/backfill-images", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ limit: 50 }),
      });
      const data: BackfillResult = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Backfill failed", { id });
        return;
      }

      toast.success(
        `Scanned ${data.scanned} · recovered ${data.enriched} · failed ${data.failed} · skipped ${data.skipped}`,
        { id }
      );
      if (data.enriched > 0) router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Network error", { id });
    } finally {
      setRunning(false);
    }
  }

  return (
    <Button type="button" variant="outline" onClick={run} disabled={running}>
      {running ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <ImageIcon className="mr-2 h-4 w-4" />
      )}
      Backfill images
    </Button>
  );
}
