/**
 * Gemini text embeddings for semantic event similarity.
 *
 * One canonical place to (a) call the embedding model, (b) build the exact text
 * we embed for an event, and (c) format a vector for a supabase-js write — so
 * the ingest pipeline, the backfill scripts, and the "more like this" query all
 * embed identically. Self-contained (only depends on the Gemini SDK + env) so a
 * `tsx` script can import it via relative path without the `@/` alias.
 *
 * Model: text-embedding-004 (768 dims). 768 is plenty for a hundreds-to-low-
 * thousands corpus and keeps the vector column / index small.
 */

import { GoogleGenerativeAI, TaskType } from "@google/generative-ai";

// gemini-embedding-001 is the embedding model this project's API key can reach
// (text-embedding-004 404s for it). It defaults to 3072 dims; we request 768
// via Matryoshka truncation — small enough for pgvector's HNSW index (<=2000)
// and plenty for this corpus. Google recommends L2-normalising any sub-3072
// output, which we do below.
export const EMBEDDING_MODEL = "gemini-embedding-001";
export const EMBEDDING_DIMS = 768;

function l2normalize(v: number[]): number[] {
  let sumSq = 0;
  for (const x of v) sumSq += x * x;
  const norm = Math.sqrt(sumSq);
  return norm === 0 ? v : v.map((x) => x / norm);
}

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

/**
 * RETRIEVAL_DOCUMENT for stored content, RETRIEVAL_QUERY for the query side
 * (the user taste-vector lookup). text-embedding-004 supports asymmetric task
 * types, which materially improves retrieval quality.
 */
export type EmbeddingTaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

export async function embedText(
  text: string,
  taskType: EmbeddingTaskType = "RETRIEVAL_DOCUMENT"
): Promise<number[]> {
  const model = getGenAI().getGenerativeModel({ model: EMBEDDING_MODEL });
  // outputDimensionality isn't in this SDK version's request type, so it's
  // passed via a cast; if the API ignores it we truncate the longer vector to
  // EMBEDDING_DIMS ourselves (Matryoshka prefixes are valid lower-dim embeddings).
  const request = {
    content: { role: "user", parts: [{ text }] },
    taskType:
      taskType === "RETRIEVAL_QUERY"
        ? TaskType.RETRIEVAL_QUERY
        : TaskType.RETRIEVAL_DOCUMENT,
    outputDimensionality: EMBEDDING_DIMS,
  };
  const res = await model.embedContent(
    request as unknown as Parameters<typeof model.embedContent>[0]
  );
  const values = res.embedding?.values;
  if (!values || values.length === 0) {
    throw new Error("Empty embedding returned from Gemini");
  }
  const truncated = values.length > EMBEDDING_DIMS ? values.slice(0, EMBEDDING_DIMS) : values;
  return l2normalize(truncated);
}

/**
 * Canonical text representation of an event for embedding. Title carries most
 * of the signal; the short description (or a capped slice of the long one) adds
 * the practice/vibe detail. Kept identical everywhere so a stored embedding and
 * a freshly-computed query embedding live in the same space.
 */
export function embedEventText(e: {
  title: string;
  short_description?: string | null;
  description?: string | null;
}): string {
  const body =
    e.short_description?.trim() ||
    e.description?.slice(0, 1500).trim() ||
    "";
  return body ? `${e.title}\n${body}` : e.title;
}

/** Format a JS number[] as a pgvector literal (`[0.1,0.2,…]`) for supabase-js. */
export function toPgVector(arr: number[]): string {
  return `[${arr.join(",")}]`;
}
