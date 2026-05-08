"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Camera, Check } from "lucide-react";
import { getActivityTrail } from "@/lib/feedback/activity-trail";
import type { FeedbackContext } from "@/lib/feedback/capture-feedback-context";

type FormState = "idle" | "success" | "error";

const DRAFT_KEY = "ubudian_feedback_draft";

interface FeedbackFormProps {
  onSuccess: () => void;
  context: FeedbackContext | null;
  screenshotBlob: Blob | null;
  screenshotPending: boolean;
}

export function FeedbackForm({
  onSuccess,
  context,
  screenshotBlob,
  screenshotPending,
}: FeedbackFormProps) {
  const [message, setMessage] = useState(() => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem(DRAFT_KEY) ?? "";
  });
  const [website, setWebsite] = useState(""); // honeypot
  const [state, setState] = useState<FormState>("idle");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = setTimeout(() => textareaRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  // Auto-dismiss after success (brief flash)
  useEffect(() => {
    if (state === "success") {
      const t = setTimeout(() => {
        onSuccess();
      }, 500);
      return () => clearTimeout(t);
    }
  }, [state, onSuccess]);

  function clearDraft() {
    setMessage("");
    sessionStorage.removeItem(DRAFT_KEY);
  }

  function persistDraft(value: string) {
    setMessage(value);
    if (value.trim()) {
      sessionStorage.setItem(DRAFT_KEY, value);
    } else {
      sessionStorage.removeItem(DRAFT_KEY);
    }
  }

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!message.trim() || message.trim().length < 10) return;

    const payload = {
      message: message.trim(),
      page_url: context?.pageUrl ?? null,
      page_title: context?.pageTitle ?? null,
      route_params: context?.routeParams ?? {},
      viewport_width: context?.viewportWidth ?? null,
      viewport_height: context?.viewportHeight ?? null,
      activity_trail: getActivityTrail(),
      website,
    };
    const blob = screenshotBlob;
    clearDraft();
    setState("success");

    void (async () => {
      try {
        let imageUrl: string | undefined;
        if (blob) {
          const formData = new FormData();
          formData.append("screenshot", blob, "screenshot.jpg");
          const uploadRes = await fetch("/api/feedback/screenshot", {
            method: "POST",
            body: formData,
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            imageUrl = uploadData?.data?.url;
          }
        }

        const res = await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, image_url: imageUrl }),
        });
        if (!res.ok) throw new Error("Failed to submit");
      } catch {
        sessionStorage.setItem(DRAFT_KEY, payload.message);
      }
    })();
  }

  if (state === "success") {
    return (
      <div className="flex flex-col items-center gap-2 py-6">
        <Check className="h-7 w-7 text-[var(--brand-deep-green)]" />
        <p className="text-sm font-medium">Thanks!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="feedback-message" className="sr-only">Message</Label>
        <Textarea
          ref={textareaRef}
          id="feedback-message"
          value={message}
          onChange={(e) => persistDraft(e.target.value.slice(0, 2000))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (message.trim().length >= 10) handleSubmit();
            }
          }}
          placeholder="Tell us what you think… (min 10 characters; Enter to send, Shift+Enter for a new line)"
          className="mt-1 min-h-[110px]"
        />
        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>{message.length}/2000</span>
          {screenshotBlob ? (
            <span className="inline-flex items-center gap-1">
              <Camera className="h-3 w-3" />
              Screenshot attached
            </span>
          ) : screenshotPending ? (
            <span className="inline-flex items-center gap-1 opacity-70">
              <Loader2 className="h-3 w-3 animate-spin" />
              Capturing screenshot…
            </span>
          ) : null}
        </div>
      </div>

      {context && (
        <p className="truncate text-xs text-muted-foreground">
          <span className="opacity-70">Page:</span> {context.contextSummary}
        </p>
      )}

      {/* Honeypot — never visible to humans */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <Button
        type="submit"
        disabled={message.trim().length < 10}
        className="w-full"
      >
        {state === "error" ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Retry
          </>
        ) : (
          "Send"
        )}
      </Button>
    </form>
  );
}
