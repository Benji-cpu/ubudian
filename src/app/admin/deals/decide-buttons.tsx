"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function DecideButtons({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function decide(action: "publish" | "reject") {
    setBusy(true);
    await fetch("/api/admin/deals-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decisions: [{ id, action, note: `decided by admin on ${new Date().toISOString().slice(0, 10)}` }] }),
    });
    setBusy(false);
    router.refresh();
  }
  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={busy} onClick={() => decide("publish")}>Publish</Button>
      <Button size="sm" variant="outline" disabled={busy} onClick={() => decide("reject")}>Reject</Button>
    </div>
  );
}
