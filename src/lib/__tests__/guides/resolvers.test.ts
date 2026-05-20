import { describe, it, expect, vi, beforeEach } from "vitest";
import { defaultGuideResolvers } from "@/lib/guides/resolvers";

type Row = Record<string, unknown> | null;

function mockSupabase(rows: Record<string, Row>) {
  return {
    from(table: string) {
      const row = rows[table] ?? null;
      const builder: {
        _filters: Array<[string, unknown]>;
        select: () => typeof builder;
        eq: (col: string, val: unknown) => typeof builder;
        limit: () => typeof builder;
        maybeSingle: () => Promise<{ data: Row; error: null }>;
        then: <R>(onFulfilled: (v: { data: Row; error: null }) => R) => Promise<R>;
      } = {
        _filters: [],
        select() {
          return builder;
        },
        eq(col: string, val: unknown) {
          builder._filters.push([col, val]);
          return builder;
        },
        limit() {
          return builder;
        },
        maybeSingle() {
          return Promise.resolve({ data: row, error: null });
        },
        then(onFulfilled) {
          return Promise.resolve({ data: row, error: null }).then(onFulfilled);
        },
      };
      return builder;
    },
  };
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";

describe("defaultGuideResolvers", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockReset();
  });

  it("resolvePractitioner returns shape with href and image fallback", async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupabase({
        practitioners: {
          slug: "made-nawa-pranic-healing",
          name: "Made Nawa",
          short_description: "Pranic Healing, TCM, detox.",
          bio: "Twenty years…",
          hero_image_url: null,
          photo_url: "https://example.com/avatar.jpg",
          is_active: true,
        },
      }) as unknown as ReturnType<typeof createClient> extends Promise<infer C>
        ? C
        : never,
    );

    const entity = await defaultGuideResolvers.resolvePractitioner!(
      "made-nawa-pranic-healing",
    );
    expect(entity).toEqual({
      kind: "practitioner",
      slug: "made-nawa-pranic-healing",
      title: "Made Nawa",
      subtitle: "Pranic Healing, TCM, detox.",
      href: "/practitioners/made-nawa-pranic-healing",
      imageUrl: "https://example.com/avatar.jpg",
    });
  });

  it("resolvePlace prefers hero_image_url over photo_urls[0]", async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupabase({
        places: {
          slug: "pura-saraswati",
          name: "Pura Saraswati",
          short_description: "Water-temple at the centre of Ubud.",
          description: null,
          hero_image_url: "https://example.com/hero.jpg",
          photo_urls: ["https://example.com/other.jpg"],
          neighbourhood: "Central Ubud",
          is_published: true,
        },
      }) as unknown as ReturnType<typeof createClient> extends Promise<infer C>
        ? C
        : never,
    );

    const entity = await defaultGuideResolvers.resolvePlace!("pura-saraswati");
    expect(entity?.href).toBe("/places/pura-saraswati");
    expect(entity?.imageUrl).toBe("https://example.com/hero.jpg");
    expect(entity?.subtitle).toBe("Water-temple at the centre of Ubud.");
  });

  it("resolvePartner returns shape with /partners href", async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupabase({
        partners: {
          slug: "villa-ametis",
          name: "Villa Ametis",
          short_description: "Sayan ridge villa.",
          description: null,
          hero_image_url: null,
          base_location: "Sayan",
          is_active: true,
        },
      }) as unknown as ReturnType<typeof createClient> extends Promise<infer C>
        ? C
        : never,
    );

    const entity = await defaultGuideResolvers.resolvePartner!("villa-ametis");
    expect(entity).toEqual({
      kind: "partner",
      slug: "villa-ametis",
      title: "Villa Ametis",
      subtitle: "Sayan ridge villa.",
      href: "/partners/villa-ametis",
      imageUrl: null,
    });
  });

  it("returns null when the row is missing (unpublished/unknown slug)", async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupabase({ practitioners: null }) as unknown as ReturnType<
        typeof createClient
      > extends Promise<infer C>
        ? C
        : never,
    );

    const entity = await defaultGuideResolvers.resolvePractitioner!("missing");
    expect(entity).toBeNull();
  });
});
