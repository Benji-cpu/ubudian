import { describe, it, expect, vi } from "vitest";
import {
  enrichFromSourceUrl,
  enrichFromUrls,
  applyEnrichment,
} from "@/lib/ingestion/url-enricher";
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

describe("DOM image fallback", () => {
  function fullPage(bodyHtml: string): string {
    return `<!doctype html><html><head></head><body>${bodyHtml}</body></html>`;
  }

  it("picks a large content image from <main> when OG/JSON-LD are absent", async () => {
    const html = fullPage(`
      <header><img src="/logo.png" width="40" height="40"></header>
      <main>
        <img src="https://cdn.example.com/cover.jpg" width="800" height="450">
      </main>
    `);
    const r = await enrichFromSourceUrl(
      "https://example.com/event",
      {},
      { fetchPageImpl: makeFetcher(html) }
    );
    expect(r.cover_image_url).toBe("https://cdn.example.com/cover.jpg");
  });

  it("skips icons, logos, and small images", async () => {
    const html = fullPage(`
      <img src="https://cdn.example.com/logo.png" width="800" height="400">
      <img src="https://cdn.example.com/small.jpg" width="100" height="80">
      <img src="https://cdn.example.com/favicon.ico" width="32" height="32">
      <main>
        <img src="https://cdn.example.com/real-cover.jpg" width="600" height="400">
      </main>
    `);
    const r = await enrichFromSourceUrl(
      "https://example.com/event",
      {},
      { fetchPageImpl: makeFetcher(html) }
    );
    expect(r.cover_image_url).toBe("https://cdn.example.com/real-cover.jpg");
  });

  it("resolves relative image URLs against the page URL", async () => {
    const html = fullPage(`<main><img src="/uploads/poster.jpg" width="800" height="450"></main>`);
    const r = await enrichFromSourceUrl(
      "https://example.com/events/abc",
      {},
      { fetchPageImpl: makeFetcher(html) }
    );
    expect(r.cover_image_url).toBe("https://example.com/uploads/poster.jpg");
  });

  it("does not use DOM fallback when OG image is present", async () => {
    const html = `<!doctype html><html><head>
      <meta property="og:image" content="https://cdn.example.com/og.jpg">
    </head><body><main>
      <img src="https://cdn.example.com/body.jpg" width="800" height="450">
    </main></body></html>`;
    const r = await enrichFromSourceUrl(
      "https://example.com/event",
      {},
      { fetchPageImpl: makeFetcher(html) }
    );
    expect(r.cover_image_url).toBe("https://cdn.example.com/og.jpg");
  });

  it("extracts media.megatix.* image from a megatix.co.id page", async () => {
    const html = fullPage(`
      <header><img src="https://static.megatix.co.id/logo.png" width="120" height="30"></header>
      <main>
        <img src="https://media.megatix.com.au/e/65468/a8SJltcdsfzct3J5ts7mjUmueE4yLKtcvESWd5dE.png" width="1200" height="630">
      </main>
    `);
    const r = await enrichFromSourceUrl(
      "https://megatix.co.id/events/experience-clarity-breathwork-APRIL",
      {},
      { fetchPageImpl: makeFetcher(html) }
    );
    expect(r.cover_image_url).toBe(
      "https://media.megatix.com.au/e/65468/a8SJltcdsfzct3J5ts7mjUmueE4yLKtcvESWd5dE.png"
    );
  });
});

describe("enrichFromUrls", () => {
  it("returns empty when no candidates are valid", async () => {
    const r = await enrichFromUrls([null, undefined, "", "   "], {});
    expect(r.enrichedFields).toEqual([]);
  });

  it("tries the second candidate when the first returns nothing", async () => {
    const fetchPageImpl = vi
      .fn()
      .mockResolvedValueOnce(htmlPage(`<title>nothing</title>`))
      .mockResolvedValueOnce(
        htmlPage(`<meta property="og:image" content="https://cdn.example.com/b.jpg">`)
      );
    const r = await enrichFromUrls(
      ["https://a.com/", "https://b.com/"],
      {},
      { fetchPageImpl }
    );
    expect(r.cover_image_url).toBe("https://cdn.example.com/b.jpg");
    expect(fetchPageImpl).toHaveBeenCalledTimes(2);
  });

  it("stops after finding cover_image_url", async () => {
    const fetchPageImpl = vi
      .fn()
      .mockResolvedValueOnce(
        htmlPage(`<meta property="og:image" content="https://cdn.example.com/a.jpg">`)
      )
      .mockResolvedValueOnce(htmlPage(`<title>should not be fetched</title>`));
    const r = await enrichFromUrls(
      ["https://a.com/", "https://b.com/"],
      {},
      { fetchPageImpl }
    );
    expect(r.cover_image_url).toBe("https://cdn.example.com/a.jpg");
    expect(fetchPageImpl).toHaveBeenCalledTimes(1);
  });

  it("deduplicates identical candidate URLs", async () => {
    const fetchPageImpl = vi.fn().mockResolvedValue(htmlPage(`<title>x</title>`));
    await enrichFromUrls(["https://a.com/", "https://a.com/"], {}, { fetchPageImpl });
    expect(fetchPageImpl).toHaveBeenCalledTimes(1);
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
