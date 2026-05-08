"use client";

import { useState, useEffect } from "react";
import { MessageSquarePlus } from "lucide-react";
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
  const [context, setContext] = useState<FeedbackContext | null>(null);
  const [screenshotBlob, setScreenshotBlob] = useState<Blob | null>(null);
  const [screenshotPending, setScreenshotPending] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user);
    });
  }, []);

  if (!isLoggedIn) return null;

  function handleOpen() {
    // Capture context synchronously, open the modal immediately, and run
    // the screenshot capture in the background — the form is usable while
    // the screenshot is still being taken.
    setContext(captureFeedbackContext());
    setScreenshotBlob(null);
    setScreenshotPending(true);
    setOpen(true);

    void (async () => {
      try {
        const blob = await captureScreenshot();
        setScreenshotBlob(blob);
      } finally {
        setScreenshotPending(false);
      }
    })();
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setContext(null);
      setScreenshotBlob(null);
      setScreenshotPending(false);
    }
  }

  return (
    <>
      {!open && (
        <Button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full shadow-lg bg-brand-deep-green text-brand-gold hover:bg-brand-deep-green/90 dark:bg-card dark:hover:bg-card/90"
          size="icon"
          aria-label="Send feedback"
        >
          <MessageSquarePlus className="h-5 w-5" />
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
            screenshotPending={screenshotPending}
            onSuccess={() => handleOpenChange(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
