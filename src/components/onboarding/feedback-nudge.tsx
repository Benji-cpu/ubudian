"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

// Cooldowns indexed by nudge count.
// - count 0 → first prompt 5 min after the welcome modal dismissed
// - count 1 → 24h cooldown
// - count 2 → 72h cooldown
// - count 3+ → 7 days cooldown forever after
const COOLDOWN_MS = [
  5 * 60 * 1000,
  24 * 60 * 60 * 1000,
  72 * 60 * 60 * 1000,
  7 * 24 * 60 * 60 * 1000,
];

// Minimum seconds the user must be on the page in this session before we
// show *any* nudge — never interrupt the first 30 seconds of a visit.
const MIN_SESSION_MS = 30 * 1000;

// Spotlight the FAB after the nudge closes (matches the welcome-modal effect).
const SPOTLIGHT_ATTR = "data-onboarding-spotlight";
const SPOTLIGHT_DURATION_MS = 2500;

type Variant = {
  title: string;
  body: string;
  primaryCta: string;
  dismissCta: string;
};

const VARIANTS: Variant[] = [
  {
    title: "Quick question — what are you here for?",
    body:
      "You've had a moment to look around. We're still shaping what The Ubudian becomes, and your honest answer right now matters: what brought you in, and what would make you actually come back?",
    primaryCta: "Tell us",
    dismissCta: "Not now",
  },
  {
    title: "What's missing?",
    body:
      "Healers and bodyworkers? Unique offerings off the beaten path? Restaurants worth crossing town for? Tell us what category we don't have yet — or which existing one feels thin.",
    primaryCta: "Send a thought",
    dismissCta: "Not now",
  },
  {
    title: "Thanks for coming back.",
    body:
      "Genuinely — you keep showing up, and that means a lot. So: how's it actually landing for you? What's clicking, what isn't, what would make this feel more like yours?",
    primaryCta: "Share",
    dismissCta: "Maybe later",
  },
  {
    title: "Still glad you're here.",
    body:
      "You're one of the people shaping what this becomes. If there's one thing you'd like us to build, fix, or add next — we'd love to hear it.",
    primaryCta: "Share",
    dismissCta: "Maybe later",
  },
];

function pickVariant(count: number): Variant {
  if (count < VARIANTS.length) return VARIANTS[count];
  // After we run out of fresh prompts, alternate between the two gratitude ones.
  return VARIANTS[2 + (count % 2)];
}

function getCooldownMs(count: number): number {
  return COOLDOWN_MS[Math.min(count, COOLDOWN_MS.length - 1)];
}

function storageKey(userId: string, field: "count" | "lastAt"): string {
  return `ubudian.nudge.${userId}.${field}`;
}

function readNudgeState(userId: string): { count: number; lastAt: number } {
  if (typeof window === "undefined") return { count: 0, lastAt: 0 };
  try {
    const count = parseInt(
      window.localStorage.getItem(storageKey(userId, "count")) ?? "0",
      10,
    );
    const lastAtRaw = window.localStorage.getItem(storageKey(userId, "lastAt"));
    const lastAt = lastAtRaw ? Date.parse(lastAtRaw) : 0;
    return {
      count: Number.isFinite(count) ? count : 0,
      lastAt: Number.isFinite(lastAt) ? lastAt : 0,
    };
  } catch {
    return { count: 0, lastAt: 0 };
  }
}

function writeNudgeState(userId: string, count: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(userId, "count"), String(count));
    window.localStorage.setItem(
      storageKey(userId, "lastAt"),
      new Date().toISOString(),
    );
  } catch {
    // Private mode or quota — silently ignore. Worst case the user sees the
    // nudge again on next session; not the end of the world.
  }
}

function spotlightFeedbackFab(): void {
  if (typeof document === "undefined") return;
  document.body.setAttribute(SPOTLIGHT_ATTR, "true");
  window.setTimeout(() => {
    document.body.removeAttribute(SPOTLIGHT_ATTR);
  }, SPOTLIGHT_DURATION_MS);
}

export function FeedbackNudge() {
  const [open, setOpen] = useState(false);
  const [variant, setVariant] = useState<Variant | null>(null);
  const userIdRef = useRef<string | null>(null);
  const countRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const sessionStartRef = useRef<number>(Date.now());

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function init() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user || cancelled) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("welcomed_at")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;
      // Wait until the welcome modal has been dismissed before nudging.
      if (!profile?.welcomed_at) return;

      userIdRef.current = user.id;
      const state = readNudgeState(user.id);
      countRef.current = state.count;

      // Anchor for the *next* nudge:
      // - if we've nudged before, anchor on lastAt
      // - if we've never nudged, anchor on welcomed_at (i.e. 5 min after sign-up)
      const anchor =
        state.lastAt > 0 ? state.lastAt : Date.parse(profile.welcomed_at);
      const cooldown = getCooldownMs(state.count);
      const eligibleAt = anchor + cooldown;
      const now = Date.now();

      const sessionElapsed = now - sessionStartRef.current;
      const cooldownDelay = Math.max(0, eligibleAt - now);
      const sessionDelay = Math.max(0, MIN_SESSION_MS - sessionElapsed);
      const delay = Math.max(cooldownDelay, sessionDelay);

      // Add a small random jitter so nudges don't all fire at the same moment
      // across devices/sessions. ±20% feels natural without being unpredictable.
      const jitter = Math.floor(delay * 0.2 * (Math.random() - 0.5));
      const finalDelay = Math.max(1000, delay + jitter);

      timerRef.current = window.setTimeout(() => {
        if (cancelled) return;
        // Final guard: don't fire if the page is hidden (user tabbed away).
        if (document.visibilityState === "hidden") return;
        setVariant(pickVariant(countRef.current));
        setOpen(true);
      }, finalDelay);
    }

    void init();

    return () => {
      cancelled = true;
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const finalize = useCallback(() => {
    const userId = userIdRef.current;
    if (!userId) return;
    const nextCount = countRef.current + 1;
    countRef.current = nextCount;
    writeNudgeState(userId, nextCount);
  }, []);

  const handleDismiss = useCallback(() => {
    setOpen(false);
    finalize();
    spotlightFeedbackFab();
  }, [finalize]);

  const handleSend = useCallback(() => {
    setOpen(false);
    finalize();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("ubudian:open-feedback"));
    }
  }, [finalize]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) handleDismiss();
      else setOpen(true);
    },
    [handleDismiss],
  );

  if (!variant) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div
          aria-hidden="true"
          className="mx-auto mb-1 h-px w-12 bg-brand-gold/80"
        />
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="font-serif text-xl text-brand-deep-green sm:text-2xl">
            {variant.title}
          </DialogTitle>
          <DialogDescription className="text-foreground/80 text-sm leading-relaxed">
            {variant.body}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="ghost"
            onClick={handleDismiss}
            className="w-full text-foreground/70 hover:text-foreground sm:w-auto"
          >
            {variant.dismissCta}
          </Button>
          <Button
            onClick={handleSend}
            className="w-full bg-[#2C4A3E] text-[#C9A84C] hover:bg-[#2C4A3E]/90 focus-visible:ring-[#C9A84C]/60 sm:w-auto"
          >
            <MessageSquarePlus className="mr-2 h-4 w-4" aria-hidden="true" />
            {variant.primaryCta}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
