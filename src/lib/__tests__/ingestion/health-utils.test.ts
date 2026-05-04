import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getBaliLocalHour,
  isActiveHours,
  computeAverageInterval,
  determineChannelStatus,
  logHealthEvent,
} from "@/lib/ingestion/health-utils";

// ---------------------------------------------------------------------------
// getBaliLocalHour
// ---------------------------------------------------------------------------

describe("getBaliLocalHour", () => {
  it("converts UTC midnight to 8 AM Bali", () => {
    const date = new Date("2026-04-17T00:00:00Z");
    expect(getBaliLocalHour(date)).toBe(8);
  });

  it("converts UTC noon to 8 PM Bali", () => {
    const date = new Date("2026-04-17T12:00:00Z");
    expect(getBaliLocalHour(date)).toBe(20);
  });

  it("wraps around midnight correctly (UTC 20:00 = Bali 4 AM next day)", () => {
    const date = new Date("2026-04-17T20:00:00Z");
    expect(getBaliLocalHour(date)).toBe(4);
  });

  it("handles UTC 16:00 as Bali midnight (0)", () => {
    const date = new Date("2026-04-17T16:00:00Z");
    expect(getBaliLocalHour(date)).toBe(0);
  });

  it("handles UTC 23:00 as Bali 7 AM", () => {
    const date = new Date("2026-04-17T23:00:00Z");
    expect(getBaliLocalHour(date)).toBe(7);
  });

  it("handles UTC 13:59 as Bali 21 (9 PM)", () => {
    const date = new Date("2026-04-17T13:30:00Z");
    expect(getBaliLocalHour(date)).toBe(21);
  });
});

// ---------------------------------------------------------------------------
// isActiveHours
// ---------------------------------------------------------------------------

describe("isActiveHours", () => {
  it("returns true at 7 AM Bali (start of active)", () => {
    // 7 AM Bali = 23:00 UTC previous day
    const date = new Date("2026-04-16T23:00:00Z");
    expect(isActiveHours(date)).toBe(true);
  });

  it("returns true at 12 PM Bali (midday)", () => {
    // 12 PM Bali = 04:00 UTC
    const date = new Date("2026-04-17T04:00:00Z");
    expect(isActiveHours(date)).toBe(true);
  });

  it("returns true at 9 PM Bali (21:00, last active hour)", () => {
    // 21:00 Bali = 13:00 UTC
    const date = new Date("2026-04-17T13:00:00Z");
    expect(isActiveHours(date)).toBe(true);
  });

  it("returns false at 10 PM Bali (22:00, first quiet hour)", () => {
    // 22:00 Bali = 14:00 UTC
    const date = new Date("2026-04-17T14:00:00Z");
    expect(isActiveHours(date)).toBe(false);
  });

  it("returns false at 3 AM Bali (deep night)", () => {
    // 3 AM Bali = 19:00 UTC
    const date = new Date("2026-04-17T19:00:00Z");
    expect(isActiveHours(date)).toBe(false);
  });

  it("returns false at 6 AM Bali (just before active)", () => {
    // 6 AM Bali = 22:00 UTC
    const date = new Date("2026-04-16T22:00:00Z");
    expect(isActiveHours(date)).toBe(false);
  });

  it("returns false at midnight Bali", () => {
    // 0:00 Bali = 16:00 UTC
    const date = new Date("2026-04-17T16:00:00Z");
    expect(isActiveHours(date)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// computeAverageInterval
// ---------------------------------------------------------------------------

describe("computeAverageInterval", () => {
  it("returns null for empty array", () => {
    expect(computeAverageInterval([])).toBeNull();
  });

  it("returns null for single timestamp", () => {
    expect(computeAverageInterval(["2026-04-17T10:00:00Z"])).toBeNull();
  });

  it("computes interval between two timestamps", () => {
    const result = computeAverageInterval([
      "2026-04-17T10:00:00Z",
      "2026-04-17T10:30:00Z",
    ]);
    expect(result).toBe(30);
  });

  it("computes average of multiple intervals", () => {
    // Intervals: 30min, 60min, 30min => avg = 40min
    const result = computeAverageInterval([
      "2026-04-17T10:00:00Z",
      "2026-04-17T10:30:00Z",
      "2026-04-17T11:30:00Z",
      "2026-04-17T12:00:00Z",
    ]);
    expect(result).toBe(40);
  });

  it("sorts timestamps before computing (out-of-order input)", () => {
    const result = computeAverageInterval([
      "2026-04-17T12:00:00Z",
      "2026-04-17T10:00:00Z",
      "2026-04-17T11:00:00Z",
    ]);
    // Sorted: 10:00, 11:00, 12:00 => intervals 60, 60 => avg 60
    expect(result).toBe(60);
  });

  it("handles sub-minute intervals", () => {
    const result = computeAverageInterval([
      "2026-04-17T10:00:00Z",
      "2026-04-17T10:00:30Z",
    ]);
    expect(result).toBe(0.5);
  });

  it("handles large intervals (multi-day)", () => {
    const result = computeAverageInterval([
      "2026-04-15T10:00:00Z",
      "2026-04-17T10:00:00Z",
    ]);
    // 2 days = 2880 minutes
    expect(result).toBe(2880);
  });

  it("handles identical timestamps (zero interval)", () => {
    const result = computeAverageInterval([
      "2026-04-17T10:00:00Z",
      "2026-04-17T10:00:00Z",
    ]);
    expect(result).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// determineChannelStatus
// ---------------------------------------------------------------------------

describe("determineChannelStatus", () => {
  describe("when lastMessageAt is null", () => {
    it("returns error", () => {
      expect(determineChannelStatus(null, null)).toBe("error");
    });

    it("returns error even with avgInterval provided", () => {
      expect(determineChannelStatus(null, 60)).toBe("error");
    });
  });

  describe("during active hours (7 AM - 10 PM Bali)", () => {
    // 12 PM Bali = 04:00 UTC
    const now = new Date("2026-04-17T04:00:00Z");

    it("returns healthy when gap is small", () => {
      // 30 min ago
      const lastMsg = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
      expect(determineChannelStatus(lastMsg, 60, now)).toBe("healthy");
    });

    it("returns warning when gap > 3x avg interval", () => {
      // avg = 60 min, 3x = 180 min; gap = 200 min
      const lastMsg = new Date(now.getTime() - 200 * 60 * 1000).toISOString();
      expect(determineChannelStatus(lastMsg, 60, now)).toBe("warning");
    });

    it("returns healthy when gap is exactly at 3x avg interval", () => {
      // avg = 60 min, 3x = 180 min; gap = 180 min (not greater)
      const lastMsg = new Date(now.getTime() - 180 * 60 * 1000).toISOString();
      expect(determineChannelStatus(lastMsg, 60, now)).toBe("healthy");
    });

    it("returns warning when gap > 6h and no avg interval", () => {
      // gap = 7h, no avg interval
      const lastMsg = new Date(now.getTime() - 7 * 60 * 60 * 1000).toISOString();
      expect(determineChannelStatus(lastMsg, null, now)).toBe("warning");
    });

    it("returns healthy when gap is 6h exactly and no avg interval", () => {
      // gap = 6h exactly (not greater)
      const lastMsg = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();
      expect(determineChannelStatus(lastMsg, null, now)).toBe("healthy");
    });

    it("returns error when gap > 12h", () => {
      // gap = 13h
      const lastMsg = new Date(now.getTime() - 13 * 60 * 60 * 1000).toISOString();
      expect(determineChannelStatus(lastMsg, 60, now)).toBe("error");
    });

    it("returns warning when gap is 12h exactly (not error)", () => {
      // gap = 12h exactly (not greater)
      const lastMsg = new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString();
      expect(determineChannelStatus(lastMsg, null, now)).toBe("warning");
    });

    it("error takes priority over warning when gap > 12h", () => {
      // avg = 10 min, 3x = 30 min; gap = 13h — should be error, not warning
      const lastMsg = new Date(now.getTime() - 13 * 60 * 60 * 1000).toISOString();
      expect(determineChannelStatus(lastMsg, 10, now)).toBe("error");
    });
  });

  describe("during quiet hours (10 PM - 7 AM Bali)", () => {
    // 2 AM Bali = 18:00 UTC
    const now = new Date("2026-04-17T18:00:00Z");

    it("returns healthy when gap is small", () => {
      const lastMsg = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
      expect(determineChannelStatus(lastMsg, 60, now)).toBe("healthy");
    });

    it("returns warning when gap > 12h", () => {
      const lastMsg = new Date(now.getTime() - 13 * 60 * 60 * 1000).toISOString();
      expect(determineChannelStatus(lastMsg, 60, now)).toBe("warning");
    });

    it("returns healthy when gap is 12h exactly", () => {
      const lastMsg = new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString();
      expect(determineChannelStatus(lastMsg, 60, now)).toBe("healthy");
    });

    it("returns error when gap > 24h", () => {
      const lastMsg = new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString();
      expect(determineChannelStatus(lastMsg, 60, now)).toBe("error");
    });

    it("returns warning when gap is 24h exactly (not error)", () => {
      const lastMsg = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      expect(determineChannelStatus(lastMsg, 60, now)).toBe("warning");
    });

    it("ignores avg interval during quiet hours", () => {
      // avg = 10 min, 3x = 30 min, gap = 60 min
      // During quiet hours the avg-based threshold is not used
      const lastMsg = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      expect(determineChannelStatus(lastMsg, 10, now)).toBe("healthy");
    });
  });
});

// ---------------------------------------------------------------------------
// logHealthEvent
// ---------------------------------------------------------------------------

describe("logHealthEvent", () => {
  let mockInsert: ReturnType<typeof vi.fn>;
  let mockFrom: ReturnType<typeof vi.fn>;
  let mockSupabase: { from: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockInsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
    mockSupabase = { from: mockFrom };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("inserts a log entry with all fields", async () => {
    await logHealthEvent(mockSupabase as unknown as SupabaseClient, {
      log_type: "error",
      channel: "telegram",
      group_name: "Ubud Events",
      message: "Channel went silent",
      metadata: { gap_hours: 14 },
    });

    expect(mockFrom).toHaveBeenCalledWith("pipeline_health_logs");
    expect(mockInsert).toHaveBeenCalledWith({
      log_type: "error",
      channel: "telegram",
      group_name: "Ubud Events",
      message: "Channel went silent",
      metadata: { gap_hours: 14 },
    });
  });

  it("defaults optional fields to null / empty object", async () => {
    await logHealthEvent(mockSupabase as unknown as SupabaseClient, {
      log_type: "info",
      message: "Health check completed",
    });

    expect(mockInsert).toHaveBeenCalledWith({
      log_type: "info",
      channel: null,
      group_name: null,
      message: "Health check completed",
      metadata: {},
    });
  });

  it("does not throw on insert error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockInsert.mockResolvedValue({ error: { message: "DB error" } });

    await expect(
      logHealthEvent(mockSupabase as unknown as SupabaseClient, {
        log_type: "warning",
        message: "test",
      }),
    ).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalledWith(
      "[health-utils] Failed to insert health log:",
      { message: "DB error" },
    );
  });

  it("does not throw on unexpected exception", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockInsert.mockRejectedValue(new Error("Network error"));

    await expect(
      logHealthEvent(mockSupabase as unknown as SupabaseClient, {
        log_type: "error",
        message: "test",
      }),
    ).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalledWith(
      "[health-utils] Unexpected error logging health event:",
      expect.any(Error),
    );
  });
});
