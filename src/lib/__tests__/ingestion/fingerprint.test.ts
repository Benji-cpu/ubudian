import { describe, it, expect } from "vitest";
import { generateFingerprint } from "@/lib/ingestion/fingerprint";

describe("generateFingerprint", () => {
  it("returns a 64-character hex string (SHA-256)", async () => {
    const hash = await generateFingerprint({
      title: "Sunset Yoga",
      start_date: "2026-03-15",
      venue_name: "Yoga Barn",
    });
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces the same hash for the same inputs (deterministic)", async () => {
    const input = { title: "Sunset Yoga", start_date: "2026-03-15", venue_name: "Yoga Barn" };
    const hash1 = await generateFingerprint(input);
    const hash2 = await generateFingerprint(input);
    expect(hash1).toBe(hash2);
  });

  it("produces different hashes for different titles", async () => {
    const hash1 = await generateFingerprint({
      title: "Sunset Yoga",
      start_date: "2026-03-15",
      venue_name: "Yoga Barn",
    });
    const hash2 = await generateFingerprint({
      title: "Morning Yoga",
      start_date: "2026-03-15",
      venue_name: "Yoga Barn",
    });
    expect(hash1).not.toBe(hash2);
  });

  it("produces the same hash regardless of venue (venue excluded to defeat re-post variants)", async () => {
    const hashA = await generateFingerprint({
      title: "Creative Voices",
      start_date: "2026-04-23",
      venue_name: "Blossom Ubud",
    });
    const hashB = await generateFingerprint({
      title: "Creative Voices",
      start_date: "2026-04-23",
      venue_name: "Blossom Space Ubud",
    });
    const hashNull = await generateFingerprint({
      title: "Creative Voices",
      start_date: "2026-04-23",
      venue_name: null,
    });
    expect(hashA).toBe(hashB);
    expect(hashA).toBe(hashNull);
  });

  it("normalizes title for consistent fingerprints", async () => {
    const hash1 = await generateFingerprint({
      title: "Sunset Yoga!",
      start_date: "2026-03-15",
      venue_name: "The Yoga Barn",
    });
    const hash2 = await generateFingerprint({
      title: "sunset yoga",
      start_date: "2026-03-15",
      venue_name: "different venue",
    });
    expect(hash1).toBe(hash2);
  });
});
