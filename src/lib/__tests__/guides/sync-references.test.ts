import { describe, it, expect, vi } from "vitest";
import {
  buildReferencesFromBody,
  syncGuideReferences,
} from "@/lib/guides/sync-references";

describe("buildReferencesFromBody", () => {
  it("returns an empty array for plain prose", () => {
    expect(buildReferencesFromBody("Just words here.")).toEqual([]);
  });

  it("returns ordered, deduped references with sequential positions", () => {
    const body =
      "Visit {{event:cacao-tuesdays}}. Then {{practitioner:putu}}. " +
      "Later {{event:cacao-tuesdays|card}} again. " +
      "And {{retreat:7-days-embodied-awakening}}.";
    expect(buildReferencesFromBody(body)).toEqual([
      { kind: "event", slug: "cacao-tuesdays", position: 0 },
      { kind: "practitioner", slug: "putu", position: 1 },
      { kind: "retreat", slug: "7-days-embodied-awakening", position: 2 },
    ]);
  });

  it("handles all six kinds", () => {
    const body =
      "{{event:e}} {{practitioner:p}} {{place:pl}} {{partner:pa}} {{story:s}} {{retreat:r}}";
    const refs = buildReferencesFromBody(body);
    expect(refs.map((r) => r.kind)).toEqual([
      "event",
      "practitioner",
      "place",
      "partner",
      "story",
      "retreat",
    ]);
  });

  it("ignores malformed shortcodes", () => {
    expect(buildReferencesFromBody("Bad {{notakind:x}} good {{event:y}}")).toEqual([
      { kind: "event", slug: "y", position: 0 },
    ]);
  });
});

describe("syncGuideReferences", () => {
  it("calls sync_guide_references with the parsed refs", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });
    const supabase = { rpc } as unknown as Parameters<typeof syncGuideReferences>[0];

    const err = await syncGuideReferences(
      supabase,
      "guide-123",
      "Body with {{event:foo}} and {{story:bar}}.",
    );

    expect(err).toBeNull();
    expect(rpc).toHaveBeenCalledWith("sync_guide_references", {
      p_guide_id: "guide-123",
      p_refs: [
        { kind: "event", slug: "foo", position: 0 },
        { kind: "story", slug: "bar", position: 1 },
      ],
    });
  });

  it("returns the error message when the RPC fails", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValue({ error: { message: "permission denied" } });
    const supabase = { rpc } as unknown as Parameters<typeof syncGuideReferences>[0];

    const err = await syncGuideReferences(supabase, "guide-1", "");
    expect(err).toBe("permission denied");
  });

  it("still calls the RPC for an empty refs array (clears stale rows)", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });
    const supabase = { rpc } as unknown as Parameters<typeof syncGuideReferences>[0];

    await syncGuideReferences(supabase, "guide-1", "no shortcodes here");

    expect(rpc).toHaveBeenCalledWith("sync_guide_references", {
      p_guide_id: "guide-1",
      p_refs: [],
    });
  });
});
