"use client";

interface GuideOutOfDateLinkProps {
  guideTitle: string;
  className?: string;
}

const DRAFT_KEY = "ubudian_feedback_draft";

/**
 * Client-side link that pre-fills the feedback draft with a guide-specific
 * subject line, then programmatically opens the floating feedback button.
 * Hidden (no-op visually) when the FAB isn't on the page (e.g. signed-out users).
 */
export function GuideOutOfDateLink({
  guideTitle,
  className,
}: GuideOutOfDateLinkProps) {
  function handleClick() {
    const prefill = `Re: "${guideTitle}" — out of date / correction\n\n`;
    try {
      sessionStorage.setItem(DRAFT_KEY, prefill);
    } catch {
      // Private mode / quota — proceed without prefill.
    }
    const fab = document.querySelector<HTMLButtonElement>(
      'button[aria-label="Send feedback"]',
    );
    if (fab) {
      fab.click();
    } else {
      // FAB not present (signed out). Soft fallback: nothing to do — the link
      // shouldn't render in that case but if it does, we don't trap the user.
      console.warn("[guide-out-of-date] feedback button not found");
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        className ??
        "inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-brand-charcoal/60 transition-colors hover:text-brand-deep-green"
      }
    >
      Spot something out of date?
    </button>
  );
}
