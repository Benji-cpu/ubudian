"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useViewerProfile } from "@/components/auth/use-viewer-profile";
import { SaveEventButton } from "./save-event-button";

/**
 * The event page's save heart, for the signed-in reader only. Their saved
 * state is read in the browser so the page itself can be cached (19 Nov 2026).
 */
export function ViewerSaveEventButton({ eventId }: { eventId: string }) {
  const { profile } = useViewerProfile();
  const profileId = profile?.id ?? null;
  const [saved, setSaved] = useState<boolean | null>(null);

  useEffect(() => {
    if (!profileId) return;
    let cancelled = false;
    createClient()
      .from("saved_events")
      .select("event_id")
      .eq("profile_id", profileId)
      .eq("event_id", eventId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setSaved(!!data);
      });
    return () => {
      cancelled = true;
    };
  }, [profileId, eventId]);

  if (!profileId || saved === null) return null;
  return <SaveEventButton eventId={eventId} profileId={profileId} initialSaved={saved} />;
}
