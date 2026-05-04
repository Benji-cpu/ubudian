/**
 * AI moderation gate for events.
 *
 * A single entry point used by both the user-submission API and the
 * ingestion pipeline. Classifies event content into:
 *   - ok           → publish (status = 'approved')
 *   - red flag     → reject  (status = 'rejected', reason surfaced to user)
 *
 * Only hard-flagged content is rejected. Borderline content passes through
 * with a lower quality_score so it sinks in the ranking — we prefer
 * permissive publication over a human queue.
 */

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { logActivity } from "@/lib/ingestion/activity-log";

export type ModerationFlag = "spam" | "inappropriate" | "misleading" | "off_topic";

export interface ModerationInput {
  title: string;
  description: string;
  organizer_name?: string | null;
  venue_name?: string | null;
  source_url?: string | null;
  /** Where this content came from, used only for audit logging. */
  origin: "user_submission" | "ingestion";
  /** Optional source_id for ingestion-origin events (for the activity log). */
  source_id?: string | null;
}

export type ModerationResult =
  | { ok: true; notes?: string }
  | { ok: false; flag: ModerationFlag; reason: string };

const MODEL = "gemini-2.0-flash";

const SYSTEM_PROMPT = `You are the content safety gate for The Ubudian, a community events platform for Ubud, Bali.

You classify a prospective event for publication. The site publishes a wide range of community events — yoga, dance, ceremonies, tantra, cacao, workshops, music, talks — so explicit-but-consensual adult-themed topics (tantra, intimacy circles, sexuality workshops, nude yoga) are ALLOWED when framed as legitimate adult workshops.

Return ONE of these flags, choosing the strongest that clearly applies:

- "ok" — safe to publish. Use this for anything that might plausibly be a real Ubud community event, even if poorly written or sparse.

- "spam" — commercial promotions masquerading as events, obvious link-farm/SEO posts, cryptocurrency pump schemes, MLM recruitment, repeated copy-paste with no local context.

- "inappropriate" — sexual content involving minors, non-consensual content, explicit illegal drugs for sale, weapons sales, hate speech, targeted harassment, graphic violence. Adult wellness (tantra, consensual intimacy) is NOT inappropriate.

- "misleading" — clear scams, impersonation of known organizations, obviously fake credentials, medical claims that are dangerous (e.g., "cure cancer with ceremonies"), deceptive pricing (bait-and-switch).

- "off_topic" — clearly not an event at all (news articles, general chatter, product ads, job postings). NOT for events outside Ubud — those should be "ok" and filtered downstream.

Be permissive. When in doubt, return "ok". Only flag content a reasonable moderator would reject.`;

const RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT as const,
  properties: {
    flag: {
      type: SchemaType.STRING as const,
      enum: ["ok", "spam", "inappropriate", "misleading", "off_topic"],
      format: "enum" as const,
      description: "Moderation decision.",
    },
    reason: {
      type: SchemaType.STRING as const,
      description: "One short sentence explaining the decision. For 'ok', summarize briefly.",
    },
    confidence: {
      type: SchemaType.NUMBER as const,
      description: "0–1, how confident the moderator is. Only reject when >= 0.7.",
    },
  },
  required: ["flag", "reason", "confidence"],
};

let genAI: GoogleGenerativeAI | null = null;
function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

/**
 * Run the moderation gate. Never throws — on any internal error,
 * returns { ok: true } with a note, because failing open is safer than
 * creating a silent publication bottleneck.
 */
export async function moderateEvent(input: ModerationInput): Promise<ModerationResult> {
  const prompt = buildPrompt(input);

  try {
    const model = getClient().getGenerativeModel({
      model: MODEL,
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0,
      },
    });

    const response = await model.generateContent(prompt);
    const raw = response.response.text().trim();
    const parsed = JSON.parse(raw) as {
      flag: "ok" | ModerationFlag;
      reason: string;
      confidence: number;
    };

    const result = resolveResult(parsed);

    // Fire-and-forget audit log
    void logActivity({
      category: "event_moderation",
      severity: result.ok ? "info" : "warning",
      title: result.ok
        ? `Moderation passed (${input.origin}): ${truncate(input.title, 80)}`
        : `Moderation rejected (${input.origin}) [${result.flag}]: ${truncate(input.title, 80)}`,
      details: {
        origin: input.origin,
        title: input.title,
        decision: result,
        model_confidence: parsed.confidence,
      },
      sourceId: input.source_id ?? undefined,
    });

    return result;
  } catch (err) {
    console.error("[moderation] Gemini call failed, failing open:", err);
    void logActivity({
      category: "event_moderation",
      severity: "warning",
      title: `Moderation failed-open (${input.origin}): ${truncate(input.title, 80)}`,
      details: {
        origin: input.origin,
        error: err instanceof Error ? err.message : String(err),
      },
      sourceId: input.source_id ?? undefined,
    });
    return { ok: true, notes: "moderation_failed_open" };
  }
}

function buildPrompt(input: ModerationInput): string {
  const lines: string[] = [];
  lines.push(`Title: ${input.title}`);
  if (input.organizer_name) lines.push(`Organizer: ${input.organizer_name}`);
  if (input.venue_name) lines.push(`Venue: ${input.venue_name}`);
  if (input.source_url) lines.push(`Source URL: ${input.source_url}`);
  lines.push("");
  lines.push("Description:");
  lines.push(input.description);
  return lines.join("\n");
}

function resolveResult(parsed: {
  flag: "ok" | ModerationFlag;
  reason: string;
  confidence: number;
}): ModerationResult {
  // Conservative bar: require 0.7+ confidence to reject.
  if (parsed.flag === "ok" || parsed.confidence < 0.7) {
    return { ok: true };
  }
  return { ok: false, flag: parsed.flag, reason: parsed.reason };
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}
