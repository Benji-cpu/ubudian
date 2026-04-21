"use client";

import { ExternalLink, Ticket } from "lucide-react";

interface EventCardExternalLinksProps {
  venueMapUrl?: string | null;
  externalTicketUrl?: string | null;
}

function openInNewTab(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function EventCardExternalLinks({
  venueMapUrl,
  externalTicketUrl,
}: EventCardExternalLinksProps) {
  return (
    <>
      {venueMapUrl && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openInNewTab(venueMapUrl);
          }}
          className="text-muted-foreground hover:text-brand-terracotta"
          title="View on map"
          aria-label="View on map"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
      )}
      {externalTicketUrl && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openInNewTab(externalTicketUrl);
          }}
          className="text-muted-foreground hover:text-brand-terracotta"
          title="Get tickets"
          aria-label="Get tickets"
        >
          <Ticket className="h-3.5 w-3.5" />
        </button>
      )}
    </>
  );
}
