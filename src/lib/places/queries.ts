import { createClient } from "@/lib/supabase/server";
import type { Place } from "@/types";

export async function getPublishedPlaces(): Promise<Place[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("places")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    return ((data ?? []) as Place[]) ?? [];
  } catch {
    return [];
  }
}

export async function getPlaceBySlug(slug: string): Promise<Place | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("places")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .limit(1)
      .maybeSingle();
    return (data as Place | null) ?? null;
  } catch {
    return null;
  }
}

export async function getRelatedPlaces(
  current: Place,
  limit = 3,
): Promise<Place[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("places")
      .select("*")
      .eq("is_published", true)
      .neq("id", current.id)
      .limit(limit);

    if (current.neighbourhood) {
      query = query.eq("neighbourhood", current.neighbourhood);
    } else {
      query = query.eq("kind", current.kind);
    }

    const { data } = await query;
    const rows = (data as Place[] | null) ?? [];
    if (rows.length >= limit) return rows;

    // Fall back to same-kind to fill the rail.
    const { data: more } = await supabase
      .from("places")
      .select("*")
      .eq("is_published", true)
      .eq("kind", current.kind)
      .neq("id", current.id)
      .limit(limit);
    const fill = (more as Place[] | null) ?? [];
    const seen = new Set(rows.map((r) => r.id));
    for (const r of fill) {
      if (rows.length >= limit) break;
      if (!seen.has(r.id)) {
        rows.push(r);
        seen.add(r.id);
      }
    }
    return rows;
  } catch {
    return [];
  }
}
