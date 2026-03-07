/**
 * Retreat.guru API adapter.
 *
 * Fetches retreat and wellness events from Retreat.guru for the Ubud area.
 */

import type { SourceAdapter, RawMessage, ParsedEvent } from "../types";
import { registerAdapter } from "../source-adapter";

const RETREAT_GURU_BASE = "https://api.retreat.guru/api/v1";

const retreatGuruAdapter: SourceAdapter = {
  sourceSlug: "retreat-guru",

  async fetchMessages(
    config: Record<string, unknown>,
    _since?: Date
  ): Promise<RawMessage[]> {
    const apiKey = process.env.RETREAT_GURU_API_KEY;
    if (!apiKey) {
      throw new Error("RETREAT_GURU_API_KEY is not configured");
    }

    const centerId = (config.center_id as string) || "";
    const limit = (config.limit as number) || 20;

    const params = new URLSearchParams({
      api_key: apiKey,
      per_page: String(limit),
    });

    if (centerId) params.set("center_id", centerId);

    const res = await fetch(`${RETREAT_GURU_BASE}/programs?${params}`);

    if (!res.ok) {
      throw new Error(`Retreat.guru API error: ${res.status} ${res.statusText}`);
    }

    const programs: RetreatGuruProgram[] = await res.json();

    if (!Array.isArray(programs)) return [];

    return programs.map((program) => {
      const parsed: ParsedEvent = {
        title: program.name || "",
        description: program.description || "",
        short_description: program.short_description?.slice(0, 200) || null,
        category: mapRetreatCategory(program.categories),
        venue_name: program.center?.name || null,
        venue_address: program.center?.address || null,
        start_date: program.start_date || "",
        end_date: program.end_date || null,
        start_time: program.start_time || null,
        end_time: program.end_time || null,
        price_info: program.price
          ? `${program.currency || "USD"} ${program.price}`
          : null,
        external_ticket_url: program.url || null,
        organizer_name: program.teachers?.[0]?.name || null,
        cover_image_url: program.image_url || null,
        source_url: program.url || null,
        source_event_id: program.id ? String(program.id) : null,
      };

      return {
        external_id: `retreat-guru-${program.id}`,
        content_text: `${parsed.title}\n\n${parsed.description}`,
        raw_data: [parsed],
      };
    });
  },
};

function mapRetreatCategory(categories?: string[]): string {
  if (!categories?.length) return "Yoga & Wellness";
  const first = categories[0].toLowerCase();
  if (first.includes("yoga")) return "Yoga & Wellness";
  if (first.includes("meditation")) return "Yoga & Wellness";
  if (first.includes("art")) return "Art & Culture";
  if (first.includes("music")) return "Music & Live Performance";
  if (first.includes("food") || first.includes("cooking")) return "Food & Drink";
  return "Yoga & Wellness";
}

interface RetreatGuruProgram {
  id?: number;
  name?: string;
  description?: string;
  short_description?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  price?: number;
  currency?: string;
  url?: string;
  image_url?: string;
  categories?: string[];
  center?: { name?: string; address?: string };
  teachers?: Array<{ name?: string }>;
}

registerAdapter(retreatGuruAdapter);
