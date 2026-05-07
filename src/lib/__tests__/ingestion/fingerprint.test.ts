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

  describe("recurring events", () => {
    const weeklyMondayRule = JSON.stringify({ frequency: "weekly", day_of_week: 1 });

    it("produces the same hash across seed-date drift when is_recurring", async () => {
      const thisWeek = await generateFingerprint({
        title: "Dance Temple",
        start_date: "2026-05-11", // next Monday
        venue_name: "Paradiso Ubud",
        is_recurring: true,
        recurrence_rule: weeklyMondayRule,
      });
      const nextWeek = await generateFingerprint({
        title: "Dance Temple",
        start_date: "2026-05-18", // Monday after
        venue_name: "Paradiso Ubud",
        is_recurring: true,
        recurrence_rule: weeklyMondayRule,
      });
      expect(thisWeek).toBe(nextWeek);
    });

    it("includes venue in recurring fingerprint so same-name slots at different venues differ", async () => {
      const paradiso = await generateFingerprint({
        title: "Ecstatic Dance",
        start_date: "2026-05-14",
        venue_name: "Paradiso Ubud",
        is_recurring: true,
        recurrence_rule: weeklyMondayRule,
      });
      const yogaBarn = await generateFingerprint({
        title: "Ecstatic Dance",
        start_date: "2026-05-14",
        venue_name: "Yoga Barn",
        is_recurring: true,
        recurrence_rule: weeklyMondayRule,
      });
      expect(paradiso).not.toBe(yogaBarn);
    });

    it("differentiates weekly slots by day of week", async () => {
      const monday = await generateFingerprint({
        title: "Movement Practice",
        start_date: "2026-05-11",
        venue_name: "Paradiso Ubud",
        is_recurring: true,
        recurrence_rule: JSON.stringify({ frequency: "weekly", day_of_week: 1 }),
      });
      const friday = await generateFingerprint({
        title: "Movement Practice",
        start_date: "2026-05-15",
        venue_name: "Paradiso Ubud",
        is_recurring: true,
        recurrence_rule: JSON.stringify({ frequency: "weekly", day_of_week: 5 }),
      });
      expect(monday).not.toBe(friday);
    });

    it("falls back to start_date fingerprint when is_recurring=false", async () => {
      const recurringFalse = await generateFingerprint({
        title: "One Off Workshop",
        start_date: "2026-05-11",
        venue_name: "Paradiso Ubud",
        is_recurring: false,
        recurrence_rule: weeklyMondayRule,
      });
      const noRecurrenceFields = await generateFingerprint({
        title: "One Off Workshop",
        start_date: "2026-05-11",
        venue_name: "Paradiso Ubud",
      });
      expect(recurringFalse).toBe(noRecurrenceFields);
    });

    it("falls back to start_date fingerprint when recurrence_rule is unparseable", async () => {
      const unparseable = await generateFingerprint({
        title: "Mystery Slot",
        start_date: "2026-05-11",
        venue_name: "Paradiso Ubud",
        is_recurring: true,
        recurrence_rule: "every now and then",
      });
      const baseline = await generateFingerprint({
        title: "Mystery Slot",
        start_date: "2026-05-11",
        venue_name: "Paradiso Ubud",
      });
      expect(unparseable).toBe(baseline);
    });

    it("does not change one-off (non-recurring) fingerprints — backward compatible", async () => {
      // This must match the behaviour the existing rows on prod have already
      // committed to, otherwise every historical fingerprint becomes invalid.
      const before = await generateFingerprint({
        title: "Sunset Yoga",
        start_date: "2026-03-15",
        venue_name: "Yoga Barn",
      });
      const explicitlyNonRecurring = await generateFingerprint({
        title: "Sunset Yoga",
        start_date: "2026-03-15",
        venue_name: "Yoga Barn",
        is_recurring: false,
        recurrence_rule: null,
      });
      expect(before).toBe(explicitlyNonRecurring);
    });
  });
});
