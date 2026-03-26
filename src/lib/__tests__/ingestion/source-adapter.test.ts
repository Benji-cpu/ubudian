import { describe, it, expect, beforeEach } from "vitest";
import type { SourceAdapter } from "@/lib/ingestion/types";

// Import fresh each test by using dynamic import tricks won't work easily,
// so we just test the registration/retrieval API as-is.
import { registerAdapter, getAdapter, getRegisteredAdapters } from "@/lib/ingestion/source-adapter";

describe("source-adapter registry", () => {
  const testAdapter: SourceAdapter = {
    sourceSlug: "test-source",
    fetchMessages: async () => [],
  };

  beforeEach(() => {
    // Register a known adapter for testing
    registerAdapter(testAdapter);
  });

  it("registers and retrieves an adapter by slug", () => {
    const adapter = getAdapter("test-source");
    expect(adapter).toBe(testAdapter);
    expect(adapter?.sourceSlug).toBe("test-source");
  });

  it("returns undefined for an unregistered slug", () => {
    const adapter = getAdapter("nonexistent-source");
    expect(adapter).toBeUndefined();
  });

  it("lists registered adapter slugs", () => {
    const slugs = getRegisteredAdapters();
    expect(slugs).toContain("test-source");
    expect(Array.isArray(slugs)).toBe(true);
  });
});
