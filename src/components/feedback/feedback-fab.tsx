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

export function FeedbackFab() {
  const [open, setOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  return (
    <>
      {!open && (
        <Button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full shadow-lg bg-[var(--brand-deep-green)] hover:bg-[var(--brand-deep-green)]/90 text-[var(--brand-gold)]"
          size="icon"
          aria-label="Send feedback"
        >
          <MessageSquarePlus className="h-5 w-5" />
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Send Feedback</DialogTitle>
            <DialogDescription>
              Found a bug or have a suggestion? Let us know.
            </DialogDescription>
          </DialogHeader>
          <FeedbackForm
            onSuccess={() => setOpen(false)}
            userEmail={userEmail}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
