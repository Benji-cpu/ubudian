import { describe, it, expect } from "vitest";
import { generateFingerprint, NO_VENUE_SENTINEL } from "@/lib/ingestion/fingerprint";

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

  it("produces different hashes for different inputs", async () => {
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

  it("uses NO_VENUE_SENTINEL when venue_name is null", async () => {
    const hashNull = await generateFingerprint({
      title: "Sunset Yoga",
      start_date: "2026-03-15",
      venue_name: null,
    });
    const hashVenue = await generateFingerprint({
      title: "Sunset Yoga",
      start_date: "2026-03-15",
      venue_name: "Yoga Barn",
    });
    expect(hashNull).not.toBe(hashVenue);
    expect(hashNull).toMatch(/^[0-9a-f]{64}$/);
  });

  it("normalizes title and venue for consistent fingerprints", async () => {
    const hash1 = await generateFingerprint({
      title: "Sunset Yoga!",
      start_date: "2026-03-15",
      venue_name: "The Yoga Barn",
    });
    const hash2 = await generateFingerprint({
      title: "sunset yoga",
      start_date: "2026-03-15",
      venue_name: "the yoga barn",
    });
    expect(hash1).toBe(hash2);
  });
});

describe("NO_VENUE_SENTINEL", () => {
  it("is a defined string constant", () => {
    expect(NO_VENUE_SENTINEL).toBe("__no_venue__");
  });
});
