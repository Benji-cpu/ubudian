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

        <div className="rounded-md border border-brand-gold/40 bg-brand-gold/10 px-3 py-3 text-sm leading-relaxed text-brand-deep-green">
          <p className="font-semibold">One quick ask: send us your feedback.</p>
          <p className="mt-1 text-foreground/80">
            {inLaunchWindow ? (
              <>
                We&rsquo;re in our launch month and actively building this. What
                you tell us right now &mdash; the good, the broken, the missing
                &mdash; directly shapes what we ship next.
              </>
            ) : (
              <>
                What you tell us &mdash; the good, the broken, the missing
                &mdash; directly shapes what we build next.
              </>
            )}
          </p>
        </div>

        <p className="text-sm text-foreground/80">
          Especially helpful right now:
        </p>

        <ul className="space-y-3 text-sm leading-relaxed">
          <li className="flex gap-3">
            <CalendarHeart
              className="mt-0.5 h-4 w-4 shrink-0 text-brand-deep-green"
              aria-hidden="true"
            />
            <span>
              <strong className="font-semibold">Events we&rsquo;re missing</strong>{" "}
              &mdash; a wrong listing, one we don&rsquo;t have yet, or an Instagram
              / WhatsApp / Telegram group we should be watching. Drop the link.
            </span>
          </li>
          <li className="flex gap-3">
            <Sparkles
              className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold"
              aria-hidden="true"
            />
            <span>
              <strong className="font-semibold">Features you wish existed</strong>{" "}
              &mdash; healers, massage, restaurants, retreats, a category we
              don&rsquo;t have yet. Tell us what&rsquo;s missing.
            </span>
          </li>
          <li className="flex gap-3">
            <Bug
              className="mt-0.5 h-4 w-4 shrink-0 text-brand-terracotta"
              aria-hidden="true"
            />
            <span>
              <strong className="font-semibold">Bugs &amp; rough edges</strong>{" "}
              &mdash; anything broken or annoying. We read everything within a
              day.
            </span>
          </li>
        </ul>

        <p className="text-muted-foreground text-xs leading-relaxed">
          You can send feedback any time from the{" "}
          <span className="inline-flex h-5 w-5 translate-y-1 items-center justify-center rounded-full bg-[#2C4A3E] text-[#C9A84C]">
            <MessageSquarePlus className="h-3 w-3" aria-hidden="true" />
          </span>{" "}
          button bottom-right of every page.
        </p>

        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            className="w-full text-foreground/70 hover:text-foreground sm:w-auto"
          >
            Maybe later
          </Button>
          <Button
            onClick={() => {
              handleOpenChange(false);
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("ubudian:open-feedback"));
              }
            }}
            className="w-full bg-[#2C4A3E] text-[#C9A84C] hover:bg-[#2C4A3E]/90 focus-visible:ring-[#C9A84C]/60 sm:w-auto"
          >
            <MessageSquarePlus className="mr-2 h-4 w-4" aria-hidden="true" />
            Send feedback now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
