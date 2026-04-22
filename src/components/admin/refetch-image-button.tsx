"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

interface RefetchImageButtonProps {
  eventId: string;
  onUpdated: (url: string) => void;
  disabled?: boolean;
}

export function RefetchImageButton({ eventId, onUpdated, disabled }: RefetchImageButtonProps) {
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    const id = toast.loading("Looking for an image…");
    try {
      const res = await fetch(`/api/admin/events/${eventId}/refetch-image`, {
        method: "POST",
      });
      const data: { url?: string; error?: string } = await res.json();

      if (!res.ok || !data.url) {
        toast.error(data.error || "No image found at this event's URLs.", { id });
        return;
      }

      onUpdated(data.url);
      toast.success("Image refetched", { id });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Network error", { id });
    } finally {
      setRunning(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={run}
      disabled={disabled || running}
    >
      {running ? (
        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="mr-2 h-3.5 w-3.5" />
      )}
      Refetch from URL
    </Button>
  );
}
