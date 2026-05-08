import { createClient } from "@/lib/supabase/server";
import { queryWithRetry } from "@/lib/supabase/retry";
import type { Guide, GuideTier, GuideIntent, ArchetypeId } from "@/types";

export interface GuideListFilters {
  tier?: GuideTier;
  intent?: GuideIntent;
  archetype?: ArchetypeId;
  limit?: number;
}

export async function getPublishedGuides(
  filters: GuideListFilters = {},
): Promise<Guide[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await queryWithRetry(() => {
      let q = supabase
        .from("guides")
        .select("*")
        .eq("status", "published")
        .order("sort_order", { ascending: true })
        .order("published_at", { ascending: false, nullsFirst: false });

      if (filters.tier) q = q.eq("tier", filters.tier);
      if (filters.intent) q = q.contains("intent_tags", [filters.intent]);
      if (filters.archetype)
        q = q.contains("archetype_tags", [filters.archetype]);
      if (filters.limit) q = q.limit(filters.limit);

      return q;
    }, "guides-list");

    if (error) {
      console.error("[guides] list error:", error);
      return [];
    }
    return (data ?? []) as Guide[];
  } catch (err) {
    console.error("[guides] list threw:", err);
    return [];
  }
}

export async function getGuideBySlug(
  slug: string,
  options: { includeUnpublished?: boolean } = {},
): Promise<Guide | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await queryWithRetry(() => {
      let q = supabase.from("guides").select("*").eq("slug", slug).limit(1);
      if (!options.includeUnpublished) {
        q = q.eq("status", "published");
      }
      return q;
    }, "guides-by-slug");

    if (error) {
      console.error("[guides] by-slug error:", error);
      return null;
    }
    const rows = (data ?? []) as Guide[];
    return rows[0] ?? null;
  } catch (err) {
    console.error("[guides] by-slug threw:", err);
    return null;
  }
}

export async function getEditorsPicks(limit = 5): Promise<Guide[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await queryWithRetry(
      () =>
        supabase
          .from("guides")
          .select("*")
          .eq("status", "published")
          .eq("is_editors_pick", true)
          .order("editors_pick_position", {
            ascending: true,
            nullsFirst: false,
          })
          .order("published_at", { ascending: false, nullsFirst: false })
          .limit(limit),
      "guides-editors-picks",
    );

    if (error) {
      console.error("[guides] editors-picks error:", error);
      return [];
    }
    return (data ?? []) as Guide[];
  } catch (err) {
    console.error("[guides] editors-picks threw:", err);
    return [];
  }
}

export async function getGuidesByRelatedSlugs(
  slugs: string[],
): Promise<Guide[]> {
  if (!slugs.length) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await queryWithRetry(
      () =>
        supabase
          .from("guides")
          .select("*")
          .eq("status", "published")
          .in("slug", slugs),
      "guides-related",
    );
    if (error) {
      console.error("[guides] related error:", error);
      return [];
    }

    const rows = (data ?? []) as Guide[];
    // preserve the order requested
    return slugs
      .map((s) => rows.find((r) => r.slug === s))
      .filter((g): g is Guide => Boolean(g));
  } catch (err) {
    console.error("[guides] related threw:", err);
    return [];
  }
}
