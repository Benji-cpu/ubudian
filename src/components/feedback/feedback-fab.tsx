"use client";

import { useState, useEffect } from "react";
import { MessageSquarePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FeedbackForm } from "@/components/feedback/feedback-form";
import { createClient } from "@/lib/supabase/client";
import { captureScreenshot } from "@/lib/feedback/capture-screenshot";
import {
  captureFeedbackContext,
  type FeedbackContext,
} from "@/lib/feedback/capture-feedback-context";

export function FeedbackFab() {
  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [context, setContext] = useState<FeedbackContext | null>(null);
  const [screenshotBlob, setScreenshotBlob] = useState<Blob | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user);
    });
  }, []);

  if (!isLoggedIn) return null;

  async function handleOpen() {
    if (capturing) return;
    setCapturing(true);
    try {
      // Capture context BEFORE the modal mounts so the screenshot reflects
      // what the user was looking at, not the dialog overlay.
      const ctx = captureFeedbackContext();
      setContext(ctx);
      const blob = await captureScreenshot();
      setScreenshotBlob(blob);
    } finally {
      setCapturing(false);
      setOpen(true);
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      // Reset captured state when modal closes so a re-open captures fresh.
      setContext(null);
      setScreenshotBlob(null);
    }
  }

  return (
    <>
      {!open && (
        <Button
          onClick={handleOpen}
          disabled={capturing}
          className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full shadow-lg bg-brand-deep-green text-brand-gold hover:bg-brand-deep-green/90 dark:bg-card dark:hover:bg-card/90"
          size="icon"
          aria-label="Send feedback"
        >
          {capturing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <MessageSquarePlus className="h-5 w-5" />
          )}
        </Button>
      )}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Send Feedback</DialogTitle>
            <DialogDescription>
              Found a bug or have a suggestion? Let us know.
            </DialogDescription>
          </DialogHeader>
          <FeedbackForm
            context={context}
            screenshotBlob={screenshotBlob}
            onSuccess={() => handleOpenChange(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
