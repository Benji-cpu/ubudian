// Barrel export for the ingestion pipeline

// Pipeline
export { runIngestion, processRawMessage, createEventFromParsed } from "./pipeline";

// Dedup
export { findDuplicates, recordDedupMatch, resolveMatch } from "./dedup";
export type { DedupCandidate, DedupInput } from "./dedup";

// LLM Parser
export { classifyMessage, classifyAndParseMessage, parseEventFromText, parseEventFromImage, compareEventsSemantically, LLMApiError } from "./llm-parser";
export type { ClassifyAndParseResult } from "./llm-parser";

// LLM Retry
export { withLLMRetry } from "./llm-retry";

// Fingerprint
export { generateFingerprint } from "./fingerprint";

// Venue Normalizer
export { normalizeVenue, clearVenueAliasCache } from "./venue-normalizer";

// Similarity
export { levenshteinDistance, stringSimilarity, titlesMatch, eventSimilarityScore, normalizeForComparison } from "./similarity";

// Date Validator
export { validateAndNormalizeDate } from "./date-validator";
export type { DateValidationResult } from "./date-validator";

// Source Adapter Registry
export { registerAdapter, getAdapter, getRegisteredAdapters } from "./source-adapter";

// Types
export type { ParsedEvent, RawMessage, ProcessResult, IngestionRunResult, SourceAdapter } from "./types";
