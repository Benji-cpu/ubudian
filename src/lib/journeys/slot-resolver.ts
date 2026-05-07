/**
 * Slot resolver — given a `journey_day_slot`, return ranked atom candidates.
 *
 * Used by the public journey detail page (Living Guide tier) to fill each
 * slot with concrete candidates the user can see and act on. Milestone 1 is
 * read-only: no per-user state, no Insider gating. Slots are resolved against
 * "now" — upcoming events (where event_ref atoms apply) and any always-on
 * curated atoms whose theme_tags overlap the slot's filter.
 *
 * For Milestone 2 (Insider self-paced) we'll extend this with a `userStartDate`
 * + `dayNumber` parameter to resolve event_ref atoms by the user's actual
 * day-N date, not just upcoming.
 */
import { createClient } from "@/lib/supabase/server";
import type {
  Event,
  JourneyAtom,
  JourneyAtomKind,
  JourneyDaySlot,
} from "@/types";

const MAX_CANDIDATES_PER_SLOT = 3;

/**
 * Resolve candidates for a single slot.
 *
 * Resolution order:
 *  1. If `slot.curated_atom_id` is set — return that one atom (editorial pin).
 *  2. Otherwise, fetch active atoms whose `kind` is in `slot.atom_kinds` AND
 *     whose `theme_tags` overlap `slot.theme_tags` (any match).
 *  3. For `event_ref` atoms whose linked event has already passed, drop them.
 *  4. Rank by overlap count (more matching theme tags = higher), tiebreak by
 *     more recent updated_at.
 *  5. Return up to 3.
 */
export async function resolveSlotCandidates(
  slot: JourneyDaySlot,
): Promise<JourneyAtom[]> {
  const supabase = await createClient();

  // 1. Editorial pin
  if (slot.curated_atom_id) {
    const { data, error } = await supabase
      .from("journey_atoms")
      .select("*")
      .eq("id", slot.curated_atom_id)
      .eq("is_active", true)
      .maybeSingle();
    if (error) {
      console.error("[slot-resolver] curated atom fetch:", error);
      return [];
    }
    return data ? [data as JourneyAtom] : [];
  }

  // 2. Atom-kind + theme-tag filter
  const kindFilter: JourneyAtomKind[] =
    slot.atom_kinds.length > 0
      ? slot.atom_kinds
      : (["event_ref", "place", "ritual", "reflection"] as JourneyAtomKind[]);

  let query = supabase
    .from("journey_atoms")
    .select("*")
    .eq("is_active", true)
    .in("kind", kindFilter);

  if (slot.theme_tags.length > 0) {
    // theme_tags array overlaps any of the slot's theme_tags
    query = query.overlaps("theme_tags", slot.theme_tags);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[slot-resolver] atom fetch:", error);
    return [];
  }

  let atoms = (data ?? []) as JourneyAtom[];

  // 3. Drop event_ref atoms whose event is in the past
  const eventRefAtoms = atoms.filter((a) => a.kind === "event_ref" && a.event_id);
  if (eventRefAtoms.length > 0) {
    const eventIds = eventRefAtoms.map((a) => a.event_id!);
    const today = new Date().toISOString().split("T")[0];
    const { data: liveEvents } = await supabase
      .from("events")
      .select("id, start_date, status")
      .in("id", eventIds)
      .gte("start_date", today)
      .eq("status", "approved");

    const liveIds = new Set((liveEvents ?? []).map((e: Pick<Event, "id">) => e.id));
    atoms = atoms.filter((a) => a.kind !== "event_ref" || (a.event_id && liveIds.has(a.event_id)));
  }

  // 4. Rank by theme-tag overlap count (descending), then updated_at (descending)
  const slotTagSet = new Set(slot.theme_tags);
  const scored = atoms.map((a) => ({
    atom: a,
    overlap: a.theme_tags.filter((t) => slotTagSet.has(t)).length,
  }));
  scored.sort((x, y) => {
    if (y.overlap !== x.overlap) return y.overlap - x.overlap;
    return y.atom.updated_at.localeCompare(x.atom.updated_at);
  });

  // 5. Cap
  return scored.slice(0, MAX_CANDIDATES_PER_SLOT).map((s) => s.atom);
}

/**
 * Resolve candidates for every slot on a day in parallel.
 */
export async function resolveDayCandidates(
  slots: JourneyDaySlot[],
): Promise<Map<string, JourneyAtom[]>> {
  const results = await Promise.all(
    slots.map(async (slot) => [slot.id, await resolveSlotCandidates(slot)] as const),
  );
  return new Map(results);
}
