/**
 * Venue geocoding via Nominatim (OpenStreetMap).
 *
 * Nominatim is free but strictly rate-limited: no more than one request
 * per second, user-agent required, heavy consumers must self-host. We
 * therefore:
 *   - cache aggressively in the venue_coordinates table (hit once per
 *     canonical name, reuse forever),
 *   - throttle each call to ~1.1s on our side,
 *   - never throw — failures are silent, events just don't appear on the
 *     map.
 *
 * Biased toward Ubud, Bali. If a venue name turns up nothing, we retry
 * with ", Ubud, Bali" appended.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { VenueCoordinates } from "@/types";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "the-ubudian/1.0 (https://ubudian-v1.vercel.app)";
const MIN_INTERVAL_MS = 1100;
const UBUD_VIEWBOX = "115.23,-8.47,115.30,-8.55"; // W,N,E,S around Ubud

let lastCallAt = 0;

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  confidence: number;
  source: "nominatim";
}

/**
 * Look up a venue by canonical name. Reads from cache first; on miss,
 * calls Nominatim and persists the result.
 *
 * Returns null if the venue can't be geocoded.
 */
export async function geocodeVenue(
  canonicalName: string,
  address?: string | null
): Promise<GeocodeResult | null> {
  const name = canonicalName?.trim();
  if (!name) return null;

  const supabase = createAdminClient();

  // Cache read
  const { data: cached } = await supabase
    .from("venue_coordinates")
    .select("latitude, longitude, confidence, source")
    .eq("canonical_name", name)
    .maybeSingle<VenueCoordinates>();

  if (cached) {
    return {
      latitude: cached.latitude,
      longitude: cached.longitude,
      confidence: cached.confidence ?? 0,
      source: "nominatim",
    };
  }

  // Cache miss — query Nominatim
  const fresh = await queryNominatim(name, address);
  if (!fresh) return null;

  // Persist (best-effort, non-blocking from caller's perspective)
  await supabase.from("venue_coordinates").insert({
    canonical_name: name,
    latitude: fresh.latitude,
    longitude: fresh.longitude,
    confidence: fresh.confidence,
    source: "nominatim",
  });

  return fresh;
}

/**
 * Direct Nominatim call with retry for the Ubud-bounded lookup when
 * the global lookup fails. Returns null on any failure.
 */
async function queryNominatim(
  name: string,
  address?: string | null
): Promise<GeocodeResult | null> {
  const tries: { q: string; bounded: boolean }[] = [];

  if (address && address.trim()) {
    tries.push({ q: `${name}, ${address}`, bounded: false });
  }
  tries.push({ q: `${name}, Ubud, Bali`, bounded: true });
  tries.push({ q: name, bounded: true });

  for (const attempt of tries) {
    const result = await fetchNominatim(attempt.q, attempt.bounded);
    if (result) return result;
  }
  return null;
}

async function fetchNominatim(
  query: string,
  bounded: boolean
): Promise<GeocodeResult | null> {
  await throttle();

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "0");
  if (bounded) {
    url.searchParams.set("viewbox", UBUD_VIEWBOX);
    url.searchParams.set("bounded", "1");
  }

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;

    const body = (await res.json()) as Array<{
      lat: string;
      lon: string;
      importance?: number;
    }>;
    const hit = body[0];
    if (!hit) return null;

    const latitude = parseFloat(hit.lat);
    const longitude = parseFloat(hit.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

    return {
      latitude,
      longitude,
      confidence: typeof hit.importance === "number" ? hit.importance : 0,
      source: "nominatim",
    };
  } catch (err) {
    console.error("[geocoding] Nominatim call failed:", err);
    return null;
  }
}

async function throttle(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastCallAt;
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_INTERVAL_MS - elapsed));
  }
  lastCallAt = Date.now();
}
