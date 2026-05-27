"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarHeart, Sparkles, Bug, MessageSquarePlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const LAUNCH_WINDOW_ENDS = new Date("2026-08-27T00:00:00+08:00");
const SPOTLIGHT_ATTR = "data-onboarding-spotlight";
const SPOTLIGHT_DURATION_MS = 2500;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

async function fireConfetti() {
  if (prefersReducedMotion()) return;
  try {
    const mod = await import("canvas-confetti");
    const confetti = mod.default;
    confetti({
      particleCount: 60,
      spread: 55,
      startVelocity: 28,
      ticks: 180,
      gravity: 0.9,
      colors: ["#C9A84C", "#B85C3F", "#FAF5EC"],
      origin: { y: 0.35 },
      scalar: 0.8,
      disableForReducedMotion: true,
    });
  } catch {
    // Confetti is a nice-to-have, never fatal.
  }
}

function spotlightFeedbackFab() {
  if (typeof document === "undefined") return;
  if (prefersReducedMotion()) return;
  document.body.setAttribute(SPOTLIGHT_ATTR, "true");
  window.setTimeout(() => {
    document.body.removeAttribute(SPOTLIGHT_ATTR);
  }, SPOTLIGHT_DURATION_MS);
}

export function WelcomeFirstLoginModal() {
  const [open, setOpen] = useState(false);
  const dismissedRef = useRef(false);
  const inLaunchWindow = new Date() < LAUNCH_WINDOW_ENDS;

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function check() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user || cancelled) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("welcomed_at")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;
      if (profile && profile.welcomed_at === null) {
        setOpen(true);
        void fireConfetti();
      }
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  const markWelcomed = useCallback(async () => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    try {
      await fetch("/api/profile/welcome", { method: "POST" });
    } catch {
      // If the network blip hits, the next session will still see the modal —
      // that's a tolerable failure mode. No retry storm.
    }
  }, []);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (!next) {
        void markWelcomed();
        spotlightFeedbackFab();
      }
    },
    [markWelcomed]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <div
          aria-hidden="true"
          className="mx-auto mb-1 h-px w-12 bg-brand-gold/80"
        />
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="font-serif text-2xl text-brand-deep-green sm:text-3xl">
            Welcome to The Ubudian.
          </DialogTitle>
          <DialogDescription className="text-foreground/80 text-base leading-relaxed">
            You&rsquo;re now part of the community that holds this town together.
            It&rsquo;s good to have you with us.
          </DialogDescription>
        </DialogHeader>

        {inLaunchWindow && (
          <p className="rounded-md border border-brand-gold/40 bg-brand-gold/10 px-3 py-2 text-center text-sm leading-snug text-brand-deep-green">
            We&rsquo;re in launch month &mdash; what you tell us right now genuinely
            shapes what gets built next.
          </p>
        )}

        <ul className="mt-1 space-y-3 text-sm leading-relaxed">
          <li className="flex gap-3">
            <CalendarHeart
              className="mt-0.5 h-4 w-4 shrink-0 text-brand-deep-green"
              aria-hidden="true"
            />
            <span>
              <strong className="font-semibold">Events</strong> &mdash; a wrong
              listing, one we&rsquo;re missing, or an Instagram / WhatsApp / Telegram
              group we should be watching. Drop the link.
            </span>
          </li>
          <li className="flex gap-3">
            <Sparkles
              className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold"
              aria-hidden="true"
            />
            <span>
              <strong className="font-semibold">Features</strong> &mdash; healers,
              massage, restaurants, retreats, a category we don&rsquo;t have yet.
              Tell us what&rsquo;s missing.
            </span>
          </li>
          <li className="flex gap-3">
            <Bug
              className="mt-0.5 h-4 w-4 shrink-0 text-brand-terracotta"
              aria-hidden="true"
            />
            <span>
              <strong className="font-semibold">Bugs & rough edges</strong>{" "}
              &mdash; anything that looks broken or annoying. We read everything
              within a day.
            </span>
          </li>
        </ul>

        <p className="text-muted-foreground text-xs leading-relaxed">
          Tap the{" "}
          <span className="inline-flex h-5 w-5 translate-y-1 items-center justify-center rounded-full bg-brand-deep-green text-brand-gold">
            <MessageSquarePlus className="h-3 w-3" aria-hidden="true" />
          </span>{" "}
          button bottom-right, any time. It&rsquo;s all welcome.
        </p>

        <Button
          onClick={() => handleOpenChange(false)}
          className="mt-1 w-full bg-brand-deep-green text-brand-gold hover:bg-brand-deep-green/90 sm:w-auto sm:self-end"
        >
          I&rsquo;m in &mdash; let&rsquo;s go
        </Button>
      </DialogContent>
    </Dialog>
  );
}
