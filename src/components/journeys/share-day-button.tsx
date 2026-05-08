"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

interface ShareDayButtonProps {
  journeyTitle: string;
  journeyUrl: string;
  dayNumber: number;
  dayTheme: string;
}

/**
 * Inline share button that lives on each JourneyDayCard. Drops the user into
 * their native share sheet on mobile (with a deep-link to the day anchor),
 * falls back to copy-to-clipboard on desktop.
 */
export function ShareDayButton({
  journeyTitle,
  journeyUrl,
  dayNumber,
  dayTheme,
}: ShareDayButtonProps) {
  const [copied, setCopied] = useState(false);
  const dayUrl = `${journeyUrl}#day-${dayNumber}`;
  const shareText = `${journeyTitle} — Day ${dayNumber}: ${dayTheme}`;

  async function handleShare() {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: shareText, text: shareText, url: dayUrl });
        return;
      } catch {
        // User cancelled — fall through to copy.
      }
    }
    try {
      await navigator.clipboard.writeText(dayUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — silently no-op.
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 rounded-full border border-brand-gold/40 bg-white/70 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-brand-deep-green transition-colors hover:bg-white"
      aria-label={`Share day ${dayNumber}`}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3" />
          Link copied
        </>
      ) : (
        <>
          <Share2 className="h-3 w-3" />
          Share day
        </>
      )}
    </button>
  );
}
