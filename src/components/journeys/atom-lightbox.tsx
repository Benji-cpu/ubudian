"use client";

/**
 * AtomLightbox — click-to-expand modal for a journey atom.
 *
 * Wraps a trigger element (the AtomLine row) and renders a Dialog with the
 * atom's full image, title, kind badge, long description, image credit, and
 * an external action link (when the atom has an event slug, affiliate URL,
 * or Google Maps URL). Lets a reader actually look at a venue / ritual /
 * place instead of squinting at a 64px thumb.
 */

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, MapPin } from "lucide-react";
import { MarkdownContent } from "@/components/blog/markdown-content";
import type { JourneyAtom, JourneyAtomKind } from "@/types";

const ATOM_KIND_LABEL: Record<JourneyAtomKind, string> = {
  event_ref: "Event",
  accommodation: "Stay",
  restaurant: "Eat",
  practitioner: "Practitioner",
  place: "Place",
  ritual: "Ritual",
  reflection: "Reflection",
};

interface AtomLightboxProps {
  atom: JourneyAtom;
  /** Optional override for an external/internal action — e.g. event slug-derived URL. */
  actionHref?: string | null;
  /** Optional label for the action — defaults to "Visit". */
  actionLabel?: string;
  children: ReactNode;
}

export function AtomLightbox({ atom, actionHref, actionLabel, children }: AtomLightboxProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full text-left"
      >
        {children}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto p-0 sm:max-w-2xl">
          <DialogTitle className="sr-only">{atom.title}</DialogTitle>
          <DialogDescription className="sr-only">
            {atom.short_description ?? `Details for ${atom.title}`}
          </DialogDescription>
          {atom.image_url && (
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
              <Image
                src={atom.image_url}
                alt={atom.title}
                fill
                sizes="(max-width: 768px) 100vw, 640px"
                className="object-cover"
              />
            </div>
          )}
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                {ATOM_KIND_LABEL[atom.kind]}
              </Badge>
            </div>
            <h2 className="mt-3 font-serif text-2xl font-medium text-brand-deep-green sm:text-3xl">
              {atom.title}
            </h2>
            {atom.short_description && (
              <p className="mt-2 text-base italic text-muted-foreground">
                {atom.short_description}
              </p>
            )}
            {atom.description && (
              <div className="mt-5 text-base leading-relaxed text-foreground/90">
                <MarkdownContent content={atom.description} />
              </div>
            )}
            {atom.image_url && atom.image_credit && (
              <p className="mt-4 text-xs text-muted-foreground">
                {atom.image_credit_url ? (
                  <a
                    href={atom.image_credit_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline-offset-2 hover:underline"
                  >
                    {atom.image_credit} &rarr;
                  </a>
                ) : (
                  atom.image_credit
                )}
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              {actionHref && (
                <Link
                  href={actionHref}
                  target={actionHref.startsWith("http") ? "_blank" : undefined}
                  rel={actionHref.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="inline-flex items-center gap-2 rounded-md bg-brand-deep-green px-4 py-2 text-sm font-semibold text-brand-cream transition-colors hover:bg-brand-deep-green/90"
                >
                  {actionLabel ?? "Visit"}
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              )}
              {atom.google_maps_url && actionHref !== atom.google_maps_url && (
                <a
                  href={atom.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-brand-gold/40 px-4 py-2 text-sm font-medium text-brand-deep-green transition-colors hover:bg-brand-cream/30"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Open in Maps
                </a>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
