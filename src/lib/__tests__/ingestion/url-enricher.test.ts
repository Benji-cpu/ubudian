import { describe, it, expect, vi } from "vitest";
import { enrichFromSourceUrl, applyEnrichment } from "@/lib/ingestion/url-enricher";
import type { ParsedEvent } from "@/lib/ingestion/types";

function htmlPage(body: string): string {
  return `<!doctype html><html><head>${body}</head><body></body></html>`;
}

function makeFetcher(html: string) {
  return vi.fn().mockResolvedValue(html);
}

describe("enrichFromSourceUrl", () => {
  it("returns empty when url is missing or invalid", async () => {
    const r1 = await enrichFromSourceUrl("", {});
    expect(r1.enrichedFields).toEqual([]);

    const r2 = await enrichFromSourceUrl("not-a-url", {});
    expect(r2.enrichedFields).toEqual([]);
  });

  it("returns empty when fetch throws", async () => {
    const fetchPageImpl = vi.fn().mockRejectedValue(new Error("404"));
    const r = await enrichFromSourceUrl("https://example.com/event", {}, { fetchPageImpl });
    expect(r.enrichedFields).toEqual([]);
  });

  it("extracts og:image into cover_image_url when missing", async () => {
    const html = htmlPage(`<meta property="og:image" content="https://cdn.example.com/poster.jpg">`);
    const r = await enrichFromSourceUrl(
      "https://example.com/event",
      {},
      { fetchPageImpl: makeFetcher(html) }
    );
    expect(r.cover_image_url).toBe("https://cdn.example.com/poster.jpg");
    expect(r.enrichedFields).toContain("cover_image_url");
  });

  it("does not overwrite existing cover_image_url", async () => {
    const html = htmlPage(`<meta property="og:image" content="https://cdn.example.com/new.jpg">`);
    const r = await enrichFromSourceUrl(
      "https://example.com/event",
      { cover_image_url: "https://existing.com/img.jpg" },
      { fetchPageImpl: makeFetcher(html) }
    );
    expect(r.cover_image_url).toBeUndefined();
    expect(r.enrichedFields).not.toContain("cover_image_url");
  });

  it("extracts og:description into short_description when missing", async () => {
    const html = htmlPage(`<meta property="og:description" content="A sound healing journey under the stars.">`);
    const r = await enrichFromSourceUrl(
      "https://example.com/event",
      {},
      { fetchPageImpl: makeFetcher(html) }
    );
    expect(r.short_description).toBe("A sound healing journey under the stars.");
  });

  it("falls back to twitter:image and meta description", async () => {
    const html = htmlPage(`
      <meta name="twitter:image" content="https://cdn.example.com/twitter.jpg">
      <meta name="description" content="Fallback description.">
    `);
    const r = await enrichFromSourceUrl(
      "https://example.com/event",
      {},
      { fetchPageImpl: makeFetcher(html) }
    );
    expect(r.cover_image_url).toBe("https://cdn.example.com/twitter.jpg");
    expect(r.short_description).toBe("Fallback description.");
  });

  it("extracts price from JSON-LD Event offers", async () => {
    const jsonLd = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Event",
      name: "Sunset Yoga",
      offers: { "@type": "Offer", price: "150000", priceCurrency: "IDR" },
    });
    const html = htmlPage(`<script type="application/ld+json">${jsonLd}</script>`);
    const r = await enrichFromSourceUrl(
      "https://example.com/event",
      {},
      { fetchPageImpl: makeFetcher(html) }
    );
    expect(r.price_info).toBe("IDR 150000");
  });

  it("formats zero price as Free", async () => {
    const jsonLd = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "MusicEvent",
      offers: { price: 0, priceCurrency: "USD" },
    });
    const html = htmlPage(`<script type="application/ld+json">${jsonLd}</script>`);
    const r = await enrichFromSourceUrl(
      "https://example.com/event",
      {},
      { fetchPageImpl: makeFetcher(html) }
    );
    expect(r.price_info).toBe("Free");
  });

  it("extracts organizer and location from JSON-LD", async () => {
    const jsonLd = JSON.stringify({
      "@type": "Event",
      name: "Tantra Workshop",
      organizer: { "@type": "Person", name: "Saraswati Institute" },
      location: {
        "@type": "Place",
        name: "Yoga Barn",
        address: {
          streetAddress: "Jl. Hanoman 44",
          addressLocality: "Ubud",
          addressCountry: "Indonesia",
        },
      },
    });
    const html = htmlPage(`<script type="application/ld+json">${jsonLd}</script>`);
    const r = await enrichFromSourceUrl(
      "https://example.com/event",
      {},
      { fetchPageImpl: makeFetcher(html) }
    );
    expect(r.organizer_name).toBe("Saraswati Institute");
    expect(r.venue_name).toBe("Yoga Barn");
    expect(r.venue_address).toBe("Jl. Hanoman 44, Ubud, Indonesia");
  });

  it("handles JSON-LD wrapped in @graph", async () => {
    const jsonLd = JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "WebSite", name: "Site" },
        { "@type": "Event", offers: { price: "50", priceCurrency: "USD" } },
      ],
    });
    const html = htmlPage(`<script type="application/ld+json">${jsonLd}</script>`);
    const r = await enrichFromSourceUrl(
      "https://example.com/event",
      {},
      { fetchPageImpl: makeFetcher(html) }
    );
    expect(r.price_info).toBe("USD 50");
  });

  it("ignores malformed JSON-LD without crashing", async () => {
    const html = htmlPage(`<script type="application/ld+json">{not valid json}</script>`);
    const r = await enrichFromSourceUrl(
      "https://example.com/event",
      {},
      { fetchPageImpl: makeFetcher(html) }
    );
    expect(r.enrichedFields).toEqual([]);
  });

  it("returns empty enrichedFields when nothing extractable", async () => {
    const html = htmlPage(`<title>Random page</title>`);
    const r = await enrichFromSourceUrl(
      "https://example.com/event",
      {},
      { fetchPageImpl: makeFetcher(html) }
    );
    expect(r.enrichedFields).toEqual([]);
  });
});

describe("applyEnrichment", () => {
  it("only writes fields named in enrichedFields", () => {
    const parsed: ParsedEvent = {
      title: "Existing",
      description: "x",
      category: "Other",
      start_date: "2026-04-20",
      cover_image_url: null,
      price_info: "old",
    };
    applyEnrichment(parsed, {
      enrichedFields: ["cover_image_url"],
      cover_image_url: "https://new.com/img.jpg",
      price_info: "this should not be applied because not in enrichedFields",
    });
    expect(parsed.cover_image_url).toBe("https://new.com/img.jpg");
    expect(parsed.price_info).toBe("old");
  });
});
