"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface SaveEventButtonProps {
  eventId: string;
  profileId: string;
  initialSaved: boolean;
  onUnsave?: () => void;
}

export function SaveEventButton({
  eventId,
  profileId,
  initialSaved,
  onUnsave,
}: SaveEventButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      const supabase = createClient();

      if (saved) {
        const { error } = await supabase
          .from("saved_events")
          .delete()
          .eq("profile_id", profileId)
          .eq("event_id", eventId);

        if (!error) {
          setSaved(false);
          onUnsave?.();
        }
      } else {
        const { error } = await supabase
          .from("saved_events")
          .insert({ profile_id: profileId, event_id: eventId });

        if (!error) {
          setSaved(true);
        }
      }
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
        saved
          ? "text-red-500 hover:text-red-600"
          : "text-muted-foreground hover:text-red-500"
      )}
      aria-label={saved ? "Unsave event" : "Save event"}
    >
      <Heart
        className={cn("h-5 w-5", saved && "fill-current")}
      />
    </button>
  );
}
