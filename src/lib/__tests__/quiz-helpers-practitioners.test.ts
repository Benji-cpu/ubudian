import { describe, it, expect } from "vitest";
import { getPractitionersForArchetype } from "@/lib/quiz-helpers";
import type { Practitioner, ArchetypeId, GuideIntent } from "@/types";

const base: Omit<Practitioner, "id" | "slug" | "name"> = {
  modalities: [],
  bio: null,
  short_description: null,
  photo_url: null,
  hero_image_url: null,
  contact_whatsapp: null,
  contact_email: null,
  contact_instagram: null,
  base_location: null,
  theme_tags: [],
  archetype_tags: [],
  intent_tags: [] as GuideIntent[],
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

function p(
  id: string,
  modalities: string[],
  archetype_tags: ArchetypeId[] = [],
): Practitioner {
  return { ...base, id, slug: id, name: id, modalities, archetype_tags };
}

describe("getPractitionersForArchetype", () => {
  const krishna = p("krishna", ["breathwork", "shamanic journey"], ["seeker", "explorer"]);
  const nina = p("nina", ["bodywork", "tantra", "breathwork"], ["seeker", "epicurean", "explorer"]);
  const ketut = p("ketut", ["ayurveda", "massage"], ["epicurean", "seeker"]);
  const made = p("made", ["pranic healing", "tcm"], ["seeker", "creative"]);
  const all = [krishna, nina, ketut, made];

  it("Tier 1: surfaces explicit archetype_tags first", () => {
    const seekers = getPractitionersForArchetype(all, "seeker", 4);
    expect(seekers).toHaveLength(4);
    // All four are tagged with seeker, so the order is stable (input order).
    expect(seekers.map((p) => p.id)).toEqual(["krishna", "nina", "ketut", "made"]);
  });

  it("Tier 2: falls back to modality affinity for archetypes without explicit tags", () => {
    // Strip archetype_tags from one practitioner to test modality fallback.
    const untagged = { ...made, archetype_tags: [] };
    const result = getPractitionersForArchetype([untagged], "creative", 3);
    // 'sound healing' / 'cacao ceremony' / 'kirtan' would match creative;
    // 'pranic healing' + 'tcm' don't, so creative gets the filler.
    expect(result).toContain(untagged); // shows up as filler
  });

  it("epicurean prefers bodywork/massage practitioners", () => {
    const epicurean = getPractitionersForArchetype(all, "epicurean", 3);
    expect(epicurean[0].id).toBe("nina"); // first tagged epicurean
    expect(epicurean.map((p) => p.id)).toContain("ketut");
  });

  it("returns at most `limit` results", () => {
    const seekers = getPractitionersForArchetype(all, "seeker", 2);
    expect(seekers).toHaveLength(2);
  });

  it("pads with filler when matches are short", () => {
    const tiny = [krishna]; // not tagged with 'connector'
    const result = getPractitionersForArchetype(tiny, "connector", 3);
    expect(result).toHaveLength(1); // only one practitioner exists; fills as far as possible
    expect(result[0].id).toBe("krishna");
  });

  it("returns empty array for empty input", () => {
    expect(getPractitionersForArchetype([], "seeker", 3)).toEqual([]);
  });
});
