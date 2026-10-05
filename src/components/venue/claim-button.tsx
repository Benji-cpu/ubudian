"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ClaimButton({ token, venueName }: { token: string; venueName: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <Button
        size="lg"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const res = await fetch("/api/venue/claim", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
          const json = await res.json().catch(() => ({}));
          setBusy(false);
          if (!res.ok || json.error) setError(json.error || "Something went wrong.");
          else router.replace("/venue");
        }}
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        Manage {venueName}&apos;s deals
      </Button>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </div>
  );
}
