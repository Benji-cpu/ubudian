"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

interface SaveGuideButtonProps {
  guideId: string;
  profileId: string;
  initialSaved: boolean;
  /** Compact icon-only variant for overlays; otherwise pill with label. */
  variant?: "icon" | "pill" | "ghost";
  onUnsave?: () => void;
}

export function SaveGuideButton({
  guideId,
  profileId,
  initialSaved,
  variant = "ghost",
  onUnsave,
}: SaveGuideButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      const supabase = createClient();
      if (saved) {
        const { error } = await supabase
          .from("saved_guides")
          .delete()
          .eq("profile_id", profileId)
          .eq("guide_id", guideId);
        if (!error) {
          setSaved(false);
          onUnsave?.();
        }
      } else {
        const { error } = await supabase
          .from("saved_guides")
          .insert({ profile_id: profileId, guide_id: guideId });
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
            ? "border-brand-gold/60 bg-brand-gold/15 text-brand-deep-green"
            : "border-brand-gold/40 bg-white/90 text-brand-deep-green hover:bg-white",
        )}
        aria-label={saved ? "Unsave guide" : "Save guide"}
      >
        <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
        {saved ? "Saved" : "Save"}
      </button>
    );
  }

  if (variant === "icon") {
    return (
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-sm transition-colors",
          saved
            ? "bg-brand-gold/30 text-brand-gold"
            : "bg-black/30 text-white hover:bg-black/45",
        )}
        aria-label={saved ? "Unsave guide" : "Save guide"}
      >
        <Bookmark className={cn("h-5 w-5", saved && "fill-current")} />
      </button>
    );
  }

  // ghost — quiet inline button, fits a guide footer or detail toolbar
  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] transition-colors",
        saved
          ? "text-brand-gold"
          : "text-brand-charcoal/60 hover:text-brand-deep-green",
      )}
      aria-label={saved ? "Unsave guide" : "Save guide"}
    >
      <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-current")} />
      {saved ? "Saved" : "Save"}
    </button>
  );
}
