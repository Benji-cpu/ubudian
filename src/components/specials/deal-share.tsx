"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DealShareProps {
  url: string;
  /** "Curry Cure at Pesona Lounge Ubud": the share sheet's title and the WhatsApp message. */
  text: string;
}

/**
 * One "Share" button: the phone's share sheet where there is one, else it
 * copies the link. WhatsApp sits next to it because that is where most
 * readers in Ubud pass a deal on.
 */
export function DealShare({ url, text }: DealShareProps) {
  const [state, setState] = useState<"idle" | "copied" | "manual">("idle");

  async function share() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: text, text, url });
        return;
      } catch (err) {
        // Closing the share sheet is a choice, not a failure.
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setState("copied");
      setTimeout(() => setState("idle"), 2500);
    } catch {
      setState("manual");
    }
  }

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${text}: ${url}`)}`;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" size="lg" onClick={share} className="min-h-11">
          {state === "copied" ? (
            <>
              <Check className="h-4 w-4" aria-hidden />
              Link copied
            </>
          ) : (
            <>
              <Share2 className="h-4 w-4" aria-hidden />
              Share this deal
            </>
          )}
        </Button>
        <Button asChild size="lg" variant="outline" className="min-h-11">
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Send on WhatsApp
          </a>
        </Button>
      </div>
      {state === "manual" ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Copy this link: <span className="select-all break-all font-medium text-foreground">{url}</span>
        </p>
      ) : null}
      {/* Screen readers hear the copy confirmation without moving focus. */}
      <span className="sr-only" aria-live="polite">
        {state === "copied" ? "Link copied" : ""}
      </span>
    </div>
  );
}
