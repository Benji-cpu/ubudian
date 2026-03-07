/**
 * Gemini LLM event parser.
 * Uses Google Gemini API to:
 * 1. Classify whether a message is an event announcement
 * 2. Parse unstructured text into structured event data
 * 3. Parse event flyer images using Gemini Vision
 * 4. Compare events semantically for dedup
 *
 * Uses native structured output (responseMimeType + responseSchema) for
 * guaranteed valid JSON responses.
 */

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import {
  CLASSIFY_MESSAGE_PROMPT,
  PARSE_EVENT_PROMPT,
  PARSE_EVENT_IMAGE_PROMPT,
  SEMANTIC_DEDUP_PROMPT,
} from "./llm-prompts";
import type { ParsedEvent } from "./types";

/**
 * Error class for LLM API failures.
 * Distinguishes retryable API errors (network, rate limit, server errors)
 * from non-retryable issues (bad response format).
 */
export class LLMApiError extends Error {
  public readonly retryable: boolean;

  constructor(message: string, retryable = true) {
    super(message);
    this.name = "LLMApiError";
    this.retryable = retryable;
  }
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
 * Extract JSON from a possibly markdown-wrapped LLM response.
 * Kept as fallback utility.
 */
export function extractJSON(text: string): string {
  // Strip markdown code fences if present
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  // Find first { or [ to last } or ]
  const start = text.indexOf("{");
  const startArr = text.indexOf("[");
  const actualStart = start === -1 ? startArr : startArr === -1 ? start : Math.min(start, startArr);
  if (actualStart === -1) return text;
  const isArray = text[actualStart] === "[";
  const end = isArray ? text.lastIndexOf("]") : text.lastIndexOf("}");
  if (end === -1) return text;
  return text.slice(actualStart, end + 1);
}

// ============================================
// Structured output schemas
// ============================================

const classificationSchema = {
  type: SchemaType.OBJECT as const,
  properties: {
    is_event: { type: SchemaType.BOOLEAN as const, description: "Whether the message contains an event announcement" },
    confidence: { type: SchemaType.NUMBER as const, description: "Confidence score from 0.0 to 1.0" },
    reason: { type: SchemaType.STRING as const, description: "Brief explanation of the classification" },
  },
  required: ["is_event", "confidence", "reason"] ,
};

const parsedEventItemSchema = {
  type: SchemaType.OBJECT as const,
  properties: {
    title: { type: SchemaType.STRING as const, description: "Event title" },
    description: { type: SchemaType.STRING as const, description: "Full description of the event" },
    short_description: { type: SchemaType.STRING as const, description: "One-line summary (max 200 chars)", nullable: true },
    category: { type: SchemaType.STRING as const, description: "Category from the available list" },
    venue_name: { type: SchemaType.STRING as const, description: "Venue name", nullable: true },
    venue_address: { type: SchemaType.STRING as const, description: "Venue address if mentioned", nullable: true },
    venue_map_url: { type: SchemaType.STRING as const, description: "Map URL if available", nullable: true },
    start_date: { type: SchemaType.STRING as const, description: "Start date in YYYY-MM-DD format" },
    end_date: { type: SchemaType.STRING as const, description: "End date in YYYY-MM-DD format", nullable: true },
    start_time: { type: SchemaType.STRING as const, description: "Start time in HH:MM 24-hour format", nullable: true },
    end_time: { type: SchemaType.STRING as const, description: "End time in HH:MM 24-hour format", nullable: true },
    is_recurring: { type: SchemaType.BOOLEAN as const, description: "Whether this is a recurring event" },
    recurrence_rule: { type: SchemaType.STRING as const, description: "Recurrence pattern description", nullable: true },
    price_info: { type: SchemaType.STRING as const, description: "Price information", nullable: true },
    external_ticket_url: { type: SchemaType.STRING as const, description: "Ticket URL", nullable: true },
    organizer_name: { type: SchemaType.STRING as const, description: "Organizer name", nullable: true },
    organizer_contact: { type: SchemaType.STRING as const, description: "Contact info", nullable: true },
    organizer_instagram: { type: SchemaType.STRING as const, description: "Instagram handle", nullable: true },
    cover_image_url: { type: SchemaType.STRING as const, description: "Cover image URL", nullable: true },
  },
  required: ["title", "description", "category", "start_date"] ,
};

const parsedEventSchema = {
  type: SchemaType.OBJECT as const,
  properties: {
    events: {
      type: SchemaType.ARRAY as const,
      items: parsedEventItemSchema,
      description: "Array of parsed events from the message",
    },
  },
  required: ["events"] ,
};

const semanticDedupSchema = {
  type: SchemaType.OBJECT as const,
  properties: {
    is_duplicate: { type: SchemaType.BOOLEAN as const, description: "Whether the two events are the same event" },
    confidence: { type: SchemaType.NUMBER as const, description: "Confidence score from 0.0 to 1.0" },
    reasoning: { type: SchemaType.STRING as const, description: "Explanation of why these are or aren't the same event" },
  },
  required: ["is_duplicate", "confidence", "reasoning"] ,
};

export interface ClassificationResult {
  is_event: boolean;
  confidence: number;
  reason: string;
}

/**
 * Classify whether a message contains an event announcement.
 * Throws LLMApiError on API failures (retryable) or unparseable responses.
 */
export async function classifyMessage(text: string): Promise<ClassificationResult> {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: classificationSchema,
    },
  });

  let result;
  try {
    result = await model.generateContent([
      CLASSIFY_MESSAGE_PROMPT,
      `\nMessage:\n${text}`,
    ]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown API error";
    throw new LLMApiError(`Classification API call failed: ${msg}`, true);
  }

  const response = result.response.text();
  try {
    return JSON.parse(response) as ClassificationResult;
  } catch {
    throw new LLMApiError(`Failed to parse classification response: ${response}`, false);
  }
}

/**
 * Parse unstructured text into structured event data.
 * May return multiple events if the message contains several announcements.
 * Throws LLMApiError on API failures.
 */
export async function parseEventFromText(text: string): Promise<ParsedEvent[]> {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: parsedEventSchema,
    },
  });

  let result;
  try {
    result = await model.generateContent([
      PARSE_EVENT_PROMPT,
      `\nMessage:\n${text}`,
    ]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown API error";
    throw new LLMApiError(`Event parsing API call failed: ${msg}`, true);
  }

  const response = result.response.text();
  try {
    const parsed = JSON.parse(response);
    const events = parsed.events || [parsed];
    return events as ParsedEvent[];
  } catch {
    throw new LLMApiError(`Failed to parse event extraction response: ${response}`, false);
  }
}

/**
 * Parse an event flyer image using Gemini Vision.
 * Fetches the image from URL and sends it to Gemini for analysis.
 */
export async function parseEventFromImage(
  imageUrl: string,
  additionalText?: string
): Promise<ParsedEvent[]> {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: parsedEventSchema,
    },
  });

  // Fetch the image
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    console.error(`[llm-parser] Failed to fetch image: ${imageUrl}`);
    return [];
  }

  const imageBuffer = await imageResponse.arrayBuffer();
  const base64 = Buffer.from(imageBuffer).toString("base64");
  const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";

  const parts: Parameters<typeof model.generateContent>[0] = [
    PARSE_EVENT_IMAGE_PROMPT,
    {
      inlineData: {
        mimeType,
        data: base64,
      },
    },
  ];

  if (additionalText) {
    (parts as unknown[]).push(`\nAdditional context from message text:\n${additionalText}`);
  }

  let result;
  try {
    result = await model.generateContent(parts);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown API error";
    throw new LLMApiError(`Image parsing API call failed: ${msg}`, true);
  }

  const response = result.response.text();
  try {
    const parsed = JSON.parse(response);
    const events = parsed.events || [parsed];
    return events as ParsedEvent[];
  } catch {
    throw new LLMApiError(`Failed to parse image event response: ${response}`, false);
  }
}

export interface SemanticDedupResult {
  is_duplicate: boolean;
  confidence: number;
  reasoning: string;
}

/**
 * Use Gemini to semantically compare two events for dedup.
 * This is Layer 4 of the dedup engine — used when fuzzy matching is ambiguous.
 */
export async function compareEventsSemantically(
  eventA: { title: string; description: string; venue_name?: string | null; start_date: string },
  eventB: { title: string; description: string; venue_name?: string | null; start_date: string }
): Promise<SemanticDedupResult> {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: semanticDedupSchema,
    },
  });

  const prompt = SEMANTIC_DEDUP_PROMPT.replace(
    "{EVENT_A}",
    JSON.stringify(eventA, null, 2)
  ).replace("{EVENT_B}", JSON.stringify(eventB, null, 2));

  let result;
  try {
    result = await model.generateContent(prompt);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown API error";
    throw new LLMApiError(`Semantic dedup API call failed: ${msg}`, true);
  }

  const response = result.response.text();
  try {
    return JSON.parse(response) as SemanticDedupResult;
  } catch {
    throw new LLMApiError(`Failed to parse semantic dedup response: ${response}`, false);
  }
}
