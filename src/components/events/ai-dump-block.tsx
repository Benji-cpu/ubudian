"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, ImagePlus, X } from "lucide-react";

export interface AiDumpResult {
  title?: string;
  description?: string;
  short_description?: string | null;
  category?: string;
  start_date?: string | null;
  end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  venue_name?: string | null;
  venue_address?: string | null;
  price_info?: string | null;
  external_ticket_url?: string | null;
  organizer_name?: string | null;
  organizer_contact?: string | null;
  organizer_instagram?: string | null;
  is_recurring?: boolean;
}

interface AiDumpBlockProps {
  onParsed: (data: AiDumpResult) => void;
}

export function AiDumpBlock({ onParsed }: AiDumpBlockProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function pickFile(f: File | null) {
    setFile(f);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(f ? URL.createObjectURL(f) : null);
  }

  async function handleParse() {
    if (!text.trim() && !file) return;
    setStatus("loading");
    setError("");

    try {
      let res: Response;
      if (file) {
        const formData = new FormData();
        if (text.trim()) formData.append("text", text.trim());
        formData.append("image", file);
        res = await fetch("/api/events/parse-draft", {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch("/api/events/parse-draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.trim() }),
        });
      }

      const json = await res.json();
      if (!res.ok) {
        setStatus("error");
        setError(json.error || "Couldn't parse that.");
        return;
      }

      onParsed(json.data as AiDumpResult);
      setStatus("idle");
      // Collapse + clear after a successful parse so the user lands on
      // the prefilled form, not the still-open AI block.
      setOpen(false);
      setText("");
      pickFile(null);
    } catch {
      setStatus("error");
      setError("Network error — please try again.");
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group mb-6 flex w-full items-center justify-between gap-3 rounded-lg border border-dashed border-brand-deep-green/25 bg-brand-cream/40 px-4 py-3 text-left transition hover:border-brand-deep-green/50 hover:bg-brand-cream/70"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-deep-green/10 text-brand-deep-green transition group-hover:bg-brand-deep-green group-hover:text-brand-cream">
            <Sparkles className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-brand-deep-green">
              Paste a flyer or message — we&apos;ll fill in the form
            </span>
            <span className="block text-xs text-brand-charcoal/60">
              Drop in WhatsApp text, an Instagram caption, or a flyer image.
            </span>
          </span>
        </span>
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-brand-deep-green/70 group-hover:text-brand-deep-green">
          Try it
        </span>
      </button>
    );
  }

  return (
    <div className="mb-6 space-y-3 rounded-lg border border-brand-deep-green/20 bg-brand-cream/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-brand-deep-green">
          <Sparkles className="h-4 w-4" />
          AI prefill
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError("");
          }}
          className="text-brand-charcoal/50 transition hover:text-brand-deep-green"
          aria-label="Close AI prefill"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div>
        <Label htmlFor="ai-dump-text" className="text-xs font-medium text-brand-charcoal/70">
          Paste text (WhatsApp, caption, email, etc.)
        </Label>
        <Textarea
          id="ai-dump-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste the announcement text here…"
          rows={5}
          className="mt-1 bg-card/80"
          disabled={status === "loading"}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={status === "loading"}
          className="gap-1.5"
        >
          <ImagePlus className="h-4 w-4" />
          {file ? "Change image" : "Add a flyer image"}
        </Button>
        {file && (
          <div className="flex items-center gap-2 text-xs text-brand-charcoal/70">
            {filePreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={filePreview}
                alt=""
                className="h-10 w-10 rounded object-cover"
              />
            )}
            <span className="max-w-[180px] truncate">{file.name}</span>
            <button
              type="button"
              onClick={() => pickFile(null)}
              className="text-brand-charcoal/50 hover:text-brand-deep-green"
              aria-label="Remove image"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-[11px] text-brand-charcoal/55">
          You&apos;ll get to review and edit every field before submitting.
        </p>
        <Button
          type="button"
          onClick={handleParse}
          disabled={status === "loading" || (!text.trim() && !file)}
          size="sm"
          className="gap-1.5 bg-brand-deep-green text-brand-cream hover:bg-brand-deep-green/90"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Parsing…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Prefill form
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
