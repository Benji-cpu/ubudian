"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface SaveJourneyButtonProps {
  journeyId: string;
  profileId: string;
  initialSaved: boolean;
  /** Compact icon-only variant for hero overlay; otherwise pill with label. */
  variant?: "icon" | "pill";
  onUnsave?: () => void;
}

export function SaveJourneyButton({
  journeyId,
  profileId,
  initialSaved,
  variant = "icon",
  onUnsave,
}: SaveJourneyButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      const supabase = createClient();
      if (saved) {
        const { error } = await supabase
          .from("saved_journeys")
          .delete()
          .eq("profile_id", profileId)
          .eq("journey_id", journeyId);
        if (!error) {
          setSaved(false);
          onUnsave?.();
        }
      } else {
        const { error } = await supabase
          .from("saved_journeys")
          .insert({ profile_id: profileId, journey_id: journeyId });
        if (!error) setSaved(true);
      }
    });
  }

  if (variant === "pill") {
    return (
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
          saved
            ? "border-red-500/40 bg-red-500/10 text-red-600 hover:bg-red-500/15"
            : "border-brand-gold/40 bg-white/90 text-brand-deep-green hover:bg-white"
        )}
        aria-label={saved ? "Unsave retreat" : "Save retreat"}
      >
        <Heart className={cn("h-4 w-4", saved && "fill-current")} />
        {saved ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-sm transition-colors",
        saved
          ? "bg-red-500/20 text-red-500 hover:bg-red-500/30"
          : "bg-black/30 text-white hover:bg-black/45"
      )}
      aria-label={saved ? "Unsave retreat" : "Save retreat"}
    >
      <Heart className={cn("h-5 w-5", saved && "fill-current")} />
    </button>
  );
}
