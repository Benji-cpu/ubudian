import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase admin client
const mockSelectSingle = vi.fn();
const mockUpdateEq = vi.fn();
const mockUpdate = vi.fn();
const mockSelect = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: mockFrom }),
}));

// Capture activity log calls
const mockLogActivity = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/ingestion/activity-log", () => ({
  logActivity: (...args: unknown[]) => mockLogActivity(...args),
}));

import { enrichExistingEvent } from "@/lib/ingestion/pipeline";
import type { ParsedEvent } from "@/lib/ingestion/types";

const baseParsed: ParsedEvent = {
  title: "Dissolve Eros",
  description: "Conscious dance",
  short_description: "Conscious dance",
  category: "Dance & Movement",
  venue_name: "Paradiso Ubud",
  venue_address: "Jl. Goutama Sel., Ubud",
  start_date: "2026-04-28",
  end_date: null,
  start_time: "19:00",
  end_time: "21:30",
  is_recurring: false,
  price_info: "Rp 200,000",
  external_ticket_url: "https://megatix.co.id/events/dissolve-eros",
  organizer_name: "Dissolve Dances",
  cover_image_url: "https://media.megatix.com.au/e/123/cover.jpg",
  source_url: "https://megatix.co.id/events/dissolve-eros",
  source_event_id: "123",
  quality_score: 0.9,
  content_flags: [],
};

function setupSupabase(existingRow: Record<string, unknown> | null, updateError: unknown = null) {
  mockSelectSingle.mockReset();
  mockUpdateEq.mockReset();
  mockSelect.mockReset();
  mockUpdate.mockReset();
  mockFrom.mockReset();

  mockSelectSingle.mockResolvedValue({ data: existingRow, error: existingRow ? null : { message: "not found" } });
  mockSelect.mockReturnValue({
    eq: vi.fn().mockReturnValue({ single: mockSelectSingle }),
  });
  mockUpdateEq.mockResolvedValue({ error: updateError });
  mockUpdate.mockReturnValue({ eq: mockUpdateEq });

  mockFrom.mockImplementation(() => ({
    select: mockSelect,
    update: mockUpdate,
  }));
}

describe("enrichExistingEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("backfills missing fields and logs activity", async () => {
    setupSupabase({
      cover_image_url: null,
      external_ticket_url: null,
      source_url: null,
      venue_address: null,
      organizer_name: null,
      price_info: null,
      short_description: null,
    });

    const enriched = await enrichExistingEvent("evt-1", baseParsed, "src-megatix");

    expect(enriched.sort()).toEqual(
      [
        "cover_image_url",
        "external_ticket_url",
        "source_url",
        "venue_address",
        "organizer_name",
        "price_info",
        "short_description",
      ].sort()
    );

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    const updatePayload = mockUpdate.mock.calls[0][0] as Record<string, string>;
    expect(updatePayload.cover_image_url).toBe(baseParsed.cover_image_url);
    expect(updatePayload.external_ticket_url).toBe(baseParsed.external_ticket_url);

    expect(mockLogActivity).toHaveBeenCalledTimes(1);
    const logCall = mockLogActivity.mock.calls[0][0];
    expect(logCall.category).toBe("event_enriched");
    expect(logCall.sourceId).toBe("src-megatix");
  });

  it("does not overwrite existing values", async () => {
    setupSupabase({
      cover_image_url: "https://existing.example.com/img.jpg",
      external_ticket_url: "https://existing.example.com/buy",
      source_url: null,
      venue_address: "Existing address",
      organizer_name: "Existing organizer",
      price_info: "Existing price",
      short_description: "Existing summary",
    });

    const enriched = await enrichExistingEvent("evt-1", baseParsed, "src-megatix");

    // Only source_url was empty; only it should be enriched
    expect(enriched).toEqual(["source_url"]);

    const updatePayload = mockUpdate.mock.calls[0][0] as Record<string, string>;
    expect(updatePayload.source_url).toBe(baseParsed.source_url);
    expect(updatePayload.cover_image_url).toBeUndefined();
    expect(updatePayload.organizer_name).toBeUndefined();
  });

  it("is a no-op when nothing to enrich", async () => {
    setupSupabase({
      cover_image_url: "https://existing.example.com/img.jpg",
      external_ticket_url: "https://existing.example.com/buy",
      source_url: "https://existing.example.com/buy",
      venue_address: "Existing address",
      organizer_name: "Existing organizer",
      price_info: "Existing price",
      short_description: "Existing summary",
    });

    const enriched = await enrichExistingEvent("evt-1", baseParsed, "src-megatix");

    expect(enriched).toEqual([]);
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockLogActivity).not.toHaveBeenCalled();
  });

  it("returns [] and does not throw when event not found", async () => {
    setupSupabase(null);

    const enriched = await enrichExistingEvent("evt-missing", baseParsed, "src-megatix");

    expect(enriched).toEqual([]);
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockLogActivity).not.toHaveBeenCalled();
  });

  it("treats incoming empty string and null as missing values", async () => {
    setupSupabase({
      cover_image_url: null,
      external_ticket_url: null,
      source_url: null,
      venue_address: null,
      organizer_name: null,
      price_info: null,
      short_description: null,
    });

    const incoming: ParsedEvent = {
      ...baseParsed,
      cover_image_url: null,
      external_ticket_url: "",
      source_url: "https://megatix.co.id/events/dissolve-eros",
      venue_address: null,
      organizer_name: "",
      price_info: null,
      short_description: null,
    };

    const enriched = await enrichExistingEvent("evt-1", incoming, "src-megatix");

    // Only source_url has a non-empty string in incoming
    expect(enriched).toEqual(["source_url"]);
    const updatePayload = mockUpdate.mock.calls[0][0] as Record<string, string>;
    expect(Object.keys(updatePayload)).toEqual(["source_url"]);
  });
});
