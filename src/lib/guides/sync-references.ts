import {
  parseShortcodes,
  collectShortcodeRefs,
  type ShortcodeRef,
} from "@/lib/guides/shortcodes";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface SyncableReference extends ShortcodeRef {
  position: number;
}

/**
 * Pure: parse a guide body and produce the ordered, deduped reference set
 * that should land in `guide_entity_references` for the guide.
 */
export function buildReferencesFromBody(body: string): SyncableReference[] {
  const nodes = parseShortcodes(body);
  const refs = collectShortcodeRefs(nodes);
  return refs.map((ref, position) => ({ ...ref, position }));
}

/**
 * Calls the `sync_guide_references` Postgres RPC with the references derived
 * from the guide body. Atomic delete-then-insert happens server-side inside
 * the function. Returns null on success, error string on failure.
 */
export async function syncGuideReferences(
  supabase: SupabaseClient,
  guideId: string,
  body: string,
): Promise<string | null> {
  const refs = buildReferencesFromBody(body);
  const { error } = await supabase.rpc("sync_guide_references", {
    p_guide_id: guideId,
    p_refs: refs,
  });
  if (error) {
    console.error("[guides] sync_guide_references failed:", error.message);
    return error.message;
  }
  return null;
}
