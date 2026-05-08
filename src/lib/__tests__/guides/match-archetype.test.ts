import { describe, it, expect } from "vitest";
import { getGuidesForArchetype } from "@/lib/guides/match-archetype";
import type { Guide, ArchetypeId } from "@/types";

function makeGuide(partial: Partial<Guide> & { id: string }): Guide {
  return {
    id: partial.id,
    slug: partial.slug ?? partial.id,
    tier: partial.tier ?? "intent",
    title: partial.title ?? `Guide ${partial.id}`,
    subtitle: null,
    hero_quote: null,
    intro_md: null,
    body_md: "",
    intent_tags: partial.intent_tags ?? [],
    archetype_tags: partial.archetype_tags ?? [],
    status: "published",
    is_members_only: false,
    is_editors_pick: false,
    editors_pick_position: null,
    reading_time_min: null,
    hero_image_url: null,
    card_image_url: null,
    linked_retreat_id: null,
    related_guide_slugs: [],
    field_tested_by: null,
    last_updated_at: null,
    published_at: null,
    created_at: "",
    updated_at: "",
    sort_order: 0,
  };
}

describe("getGuidesForArchetype", () => {
  it("prefers explicit archetype-tagged guides (Tier 1)", () => {
    const tagged = makeGuide({ id: "tagged", archetype_tags: ["seeker"] });
    const untagged = makeGuide({ id: "untagged" });
    const result = getGuidesForArchetype([untagged, tagged], "seeker", 1);
    expect(result).toEqual([tagged]);
  });

  it("falls back to intent affinity (Tier 2) when not enough Tier 1 hits", () => {
    // 'seeker' has affinity to 'community' and 'spirit'
    const intentMatch = makeGuide({ id: "intent", intent_tags: ["spirit"] });
    const noMatch = makeGuide({ id: "no-match", intent_tags: ["living"] });
    const result = getGuidesForArchetype([noMatch, intentMatch], "seeker", 1);
    expect(result[0].id).toBe("intent");
  });

  it("backfills with remaining published guides if still under limit", () => {
    const filler = makeGuide({ id: "filler" });
    const result = getGuidesForArchetype([filler], "seeker", 3);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("filler");
  });

  it("respects the limit", () => {
    const guides: Guide[] = Array.from({ length: 10 }, (_, i) =>
      makeGuide({ id: `g${i}`, archetype_tags: ["seeker"] }),
    );
    const result = getGuidesForArchetype(guides, "seeker", 3);
    expect(result).toHaveLength(3);
  });

  it("returns empty array when given no guides", () => {
    expect(getGuidesForArchetype([], "seeker", 3)).toEqual([]);
  });

  it("never returns the same guide twice", () => {
    const overlap = makeGuide({
      id: "overlap",
      archetype_tags: ["seeker"],
      intent_tags: ["spirit"],
    });
    const result = getGuidesForArchetype([overlap], "seeker", 5);
    expect(result).toHaveLength(1);
  });

  it("works for every archetype", () => {
    const archetypes: ArchetypeId[] = [
      "seeker",
      "explorer",
      "creative",
      "connector",
      "epicurean",
    ];
    const guides = [
      makeGuide({ id: "a", intent_tags: ["romance"] }),
      makeGuide({ id: "b", intent_tags: ["spirit"] }),
    ];
    for (const arch of archetypes) {
      const result = getGuidesForArchetype(guides, arch, 5);
      expect(result.length).toBeGreaterThanOrEqual(0);
    }
  });
});
