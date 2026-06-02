/**
 * The pgvector `embedding` column rides on `select("*")` and is a ~13KB string
 * per event. It's server-only — similarity is computed via RPC, never from the
 * event object — so strip it before events cross into a client component, or it
 * bloats the RSC payload (and pointlessly ships the vector to the browser).
 *
 * Mutates and returns the same array for convenience. `embedding` is not part
 * of the `Event` type, so this is a runtime-only concern.
 */
export function stripEmbeddings<T>(events: T[]): T[] {
  for (const e of events) {
    if (e && typeof e === "object") {
      delete (e as unknown as Record<string, unknown>).embedding;
    }
  }
  return events;
}
