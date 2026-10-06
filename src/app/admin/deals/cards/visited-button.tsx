"use client";

import { useState } from "react";

/** Tap after handing the card over, so the venue isn't contacted again another way. */
export function VisitedButton({ venueId }: { venueId: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="no-print mt-2 text-xs text-[#2C4A3E]/70 underline underline-offset-2"
      disabled={done}
      onClick={async () => {
        const res = await fetch("/api/admin/deals-outreach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ venue_id: venueId, action: "in_person" }),
        });
        setDone(res.ok);
      }}
    >
      {done ? "Visited" : "Mark visited"}
    </button>
  );
}
