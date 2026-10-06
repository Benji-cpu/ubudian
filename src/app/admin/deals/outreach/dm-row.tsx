"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/** One Instagram DM: open the profile, copy the text, send it there, then tap Sent. */
export function DmRow({ venueId, name, handle, text }: { venueId: string; name: string; handle: string; text: string }) {
  const [state, setState] = useState<"idle" | "copied" | "sent" | "skipped">("idle");
  const mark = async (action: "instagram" | "optout") => {
    const res = await fetch("/api/admin/deals-outreach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ venue_id: venueId, action }),
    });
    if (res.ok) setState(action === "instagram" ? "sent" : "skipped");
  };
  if (state === "sent" || state === "skipped") {
    return <li className="p-3 text-sm text-muted-foreground">{name}: {state === "sent" ? "sent" : "won't contact"}</li>;
  }
  return (
    <li className="space-y-2 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium">{name}</p>
        <a href={`https://www.instagram.com/${handle}/`} target="_blank" rel="noreferrer" className="text-sm text-brand-terracotta underline underline-offset-2">
          @{handle}
        </a>
      </div>
      <p className="rounded-lg bg-muted p-2 text-sm">{text}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            await navigator.clipboard.writeText(text);
            setState("copied");
          }}
        >
          {state === "copied" ? "Copied" : "Copy text"}
        </Button>
        <Button size="sm" onClick={() => mark("instagram")}>Sent</Button>
        <Button size="sm" variant="ghost" onClick={() => mark("optout")}>Don&apos;t contact</Button>
      </div>
    </li>
  );
}
