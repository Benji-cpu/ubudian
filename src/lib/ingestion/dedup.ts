/**
 * 4-layer event deduplication engine.
 *
 * Layer 1: Exact source URL match
 * Layer 2: Content fingerprint hash (normalized title + date + venue)
 * Layer 3: Fuzzy string similarity on title within same date/venue
 * Layer 4: Gemini semantic comparison for ambiguous matches
 *
 * Returns potential duplicates with confidence scores for admin review.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { generateFingerprint } from "./fingerprint";
import { normalizeVenue } from "./venue-normalizer";
import { eventSimilarityScore, normalizeForComparison, titlesMatch } from "./similarity";
import { compareEventsSemantically } from "./llm-parser";
import type { DedupMatchType } from "@/types";

export interface DedupCandidate {
  eventId: string;
  matchType: DedupMatchType;
  confidence: number;
  metadata: Record<string, unknown>;
}

export interface DedupInput {
  title: string;
  start_date: string;
  venue_name?: string | null;
  source_url?: string | null;
  source_id?: string | null;
  source_event_id?: string | null;
  description?: string | null;
}

export interface DedupPrecomputed {
  normalizedVenue?: string | null;
  fingerprint?: string;
}

/**
 * Find potential duplicates for a parsed event before inserting it.
 * Returns an array of candidates ordered by confidence (highest first).
 *
 * Pass `precomputed` to skip redundant normalizeVenue/generateFingerprint calls
 * when the caller has already computed them (e.g. createEventFromParsed).
 */
export async function findDuplicates(input: DedupInput, precomputed?: DedupPrecomputed): Promise<DedupCandidate[]> {
  const supabase = createAdminClient();
  const candidates: DedupCandidate[] = [];

  // Layer 1: Exact source URL match
  if (input.source_url) {
    const { data: urlMatches } = await supabase
      .from("events")
      .select("id")
      .eq("source_url", input.source_url)
      .limit(1);

    if (urlMatches?.length) {
      candidates.push({
        eventId: urlMatches[0].id,
        matchType: "exact_url",
        confidence: 1.0,
        metadata: { source_url: input.source_url },
      });
      return candidates; // Exact URL = definite duplicate
    }
  }

  // Layer 1b: Source-specific ID match
  if (input.source_id && input.source_event_id) {
    const { data: sourceMatches } = await supabase
      .from("events")
      .select("id")
      .eq("source_id", input.source_id)
      .eq("source_event_id", input.source_event_id)
      .limit(1);

    if (sourceMatches?.length) {
      candidates.push({
        eventId: sourceMatches[0].id,
        matchType: "exact_url",
        confidence: 1.0,
        metadata: { source_id: input.source_id, source_event_id: input.source_event_id },
      });
      return candidates;
    }
  }

  // Layer 2: Content fingerprint hash (use precomputed values if available)
  const normalizedVenue = precomputed?.normalizedVenue ?? await normalizeVenue(input.venue_name);
  const fingerprint = precomputed?.fingerprint ?? await generateFingerprint({
    title: input.title,
    start_date: input.start_date,
    venue_name: normalizedVenue,
  });

  const { data: fpMatches } = await supabase
    .from("events")
    .select("id")
    .eq("content_fingerprint", fingerprint)
    .limit(5);

  if (fpMatches?.length) {
    for (const match of fpMatches) {
      candidates.push({
        eventId: match.id,
        matchType: "fingerprint",
        confidence: 0.95,
        metadata: { fingerprint },
      });
    }
    return candidates; // Fingerprint match is very reliable
  }

  // Layer 3: Fuzzy title match within same date range
  // Query events on the same date (or +/- 1 day for timezone edge cases)
  const { data: sameDateEvents } = await supabase
    .from("events")
    .select("id, title, venue_name, start_date")
    .gte("start_date", shiftDate(input.start_date, -1))
    .lte("start_date", shiftDate(input.start_date, 1))
    .limit(50);

  if (sameDateEvents?.length) {
    for (const existing of sameDateEvents) {
      if (titlesMatch(input.title, existing.title, 0.75)) {
        const similarity = eventSimilarityScore(
          { title: input.title, venue: normalizedVenue, date: input.start_date },
          { title: existing.title, venue: existing.venue_name, date: existing.start_date }
        );

        if (similarity >= 0.7) {
          candidates.push({
            eventId: existing.id,
            matchType: "fuzzy_title",
            confidence: Math.min(similarity, 0.9), // Cap fuzzy at 0.9
            metadata: {
              similarity,
              inputTitle: normalizeForComparison(input.title),
              existingTitle: normalizeForComparison(existing.title),
            },
          });
        }
      }
    }
  }

  // Layer 4: Semantic comparison for ambiguous fuzzy matches
  if (candidates.length > 0 && input.description) {
    const ambiguous = candidates.filter(
      (c) => c.matchType === "fuzzy_title" && c.confidence >= 0.6 && c.confidence <= 0.85
    );

    if (ambiguous.length > 0) {
      // Take top 3 ambiguous candidates for semantic comparison
      const toCompare = ambiguous.slice(0, 3);

      for (const candidate of toCompare) {
        try {
          // Fetch the existing event's details for semantic comparison
          const { data: existingEvent } = await supabase
            .from("events")
            .select("title, description, venue_name, start_date")
            .eq("id", candidate.eventId)
            .single();

          if (!existingEvent) continue;

          const semanticResult = await compareEventsSemantically(
            {
              title: input.title,
              description: input.description,
              venue_name: input.venue_name,
              start_date: input.start_date,
            },
            {
              title: existingEvent.title,
              description: existingEvent.description,
              venue_name: existingEvent.venue_name,
              start_date: existingEvent.start_date,
            }
          );

          if (semanticResult.is_duplicate && semanticResult.confidence >= 0.7) {
            // Upgrade: LLM confirms duplicate
            candidate.matchType = "semantic";
            candidate.confidence = Math.max(candidate.confidence, 0.85 + semanticResult.confidence * 0.1);
            candidate.metadata = {
              ...candidate.metadata,
              semantic_confidence: semanticResult.confidence,
              semantic_reasoning: semanticResult.reasoning,
            };
          } else if (!semanticResult.is_duplicate && semanticResult.confidence >= 0.7) {
            // Downgrade: LLM says not duplicate
            candidate.confidence = Math.min(candidate.confidence, 0.4);
            candidate.metadata = {
              ...candidate.metadata,
              semantic_confidence: semanticResult.confidence,
              semantic_reasoning: semanticResult.reasoning,
              semantic_not_dup: true,
            };
          }
        } catch (err) {
          // LLM failures should not block the pipeline
          console.error("[dedup] Semantic comparison failed:", err instanceof Error ? err.message : err);
        }
      }
    }
  }

  // Sort by confidence descending
  candidates.sort((a, b) => b.confidence - a.confidence);
  return candidates;
}

/**
 * Record a dedup match in the database for admin review.
 */
export async function recordDedupMatch(
  newEventId: string,
  candidate: DedupCandidate
): Promise<void> {
  const supabase = createAdminClient();

  // Ensure consistent ordering (smaller UUID first) to avoid duplicate entries
  const [eventA, eventB] =
    newEventId < candidate.eventId
      ? [newEventId, candidate.eventId]
      : [candidate.eventId, newEventId];

  await supabase
    .from("dedup_matches")
    .upsert(
      {
        event_a_id: eventA,
        event_b_id: eventB,
        match_type: candidate.matchType,
        confidence: candidate.confidence,
        status: "pending",
        metadata: candidate.metadata,
      },
      { onConflict: "event_a_id,event_b_id" }
    );
}

/**
 * Resolve a dedup match as confirmed duplicate, not duplicate, or merged.
 */
export async function resolveMatch(
  matchId: string,
  resolution: "confirmed_dup" | "not_dup" | "merged",
  resolvedBy: string
): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from("dedup_matches")
    .update({
      status: resolution,
      resolved_by: resolvedBy,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", matchId);
}

/**
 * Shift a date string (YYYY-MM-DD) by N days.
 */
function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
