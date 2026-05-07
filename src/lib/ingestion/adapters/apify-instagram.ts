/**
 * Apify Instagram adapter — public-profile scraper for venues we don't have
 * Meta Graph API access to (Paradiso Ubud, etc.).
 *
 * Routes through Apify's `apify/instagram-profile-scraper` actor in sync mode:
 * one HTTP request, dataset items returned in the response body. No IG auth.
 *
 * Configured per-source-row so the same adapter can serve multiple venues:
 *   { "handles": ["paradisoubud"], "max_posts_per_handle": 8 }
 *
 * Posts are forwarded to the pipeline with their image URLs populated;
 * `parseEventFromImage()` (Gemini Vision) handles OCR of weekly schedule
 * posters via the rules in PARSE_EVENT_IMAGE_PROMPT.
 */

import type { SourceAdapter, RawMessage } from "../types";
import { registerAdapter } from "../source-adapter";

const APIFY_BASE = "https://api.apify.com/v2";
const ACTOR_ID = "apify~instagram-profile-scraper";

interface ApifyPost {
  id?: string;
  shortCode?: string;
  caption?: string | null;
  url?: string | null;
  displayUrl?: string | null;
  images?: string[] | null;
  videoUrl?: string | null;
  type?: string;
  timestamp?: string | null;
  ownerUsername?: string | null;
  ownerId?: string | null;
}

interface ApifyProfile {
  username?: string;
  latestPosts?: ApifyPost[];
}

const apifyInstagramAdapter: SourceAdapter = {
  sourceSlug: "apify-instagram",

  async fetchMessages(
    config: Record<string, unknown>,
    _since?: Date
  ): Promise<RawMessage[]> {
    const token = process.env.APIFY_API_TOKEN;
    if (!token) {
      throw new Error("APIFY_API_TOKEN is not configured");
    }

    const handles = (config.handles as string[]) || [];
    if (handles.length === 0) {
      console.warn("[apify-instagram] No handles configured");
      return [];
    }

    const maxPosts = Math.max(1, Math.min(50, Number(config.max_posts_per_handle) || 8));
    const minCaption = Math.max(0, Number(config.min_caption_length) || 0);

    const input = {
      usernames: handles,
      resultsLimit: maxPosts,
      resultsType: "posts",
    };

    const url = `${APIFY_BASE}/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`;

    // Actor returns one row per username with `latestPosts` nested inside —
    // flatten across all profiles to get a flat post stream.
    let posts: ApifyPost[];
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        console.error(`[apify-instagram] Actor run failed: ${res.status} ${await res.text().catch(() => "")}`);
        return [];
      }
      const profiles = (await res.json()) as ApifyProfile[];
      posts = profiles.flatMap((p) => p.latestPosts ?? []);
    } catch (err) {
      console.error("[apify-instagram] Fetch error:", err);
      return [];
    }

    const messages: RawMessage[] = [];

    for (const post of posts) {
      const caption = (post.caption || "").trim();
      if (caption.length < minCaption) continue;

      const imageUrls = collectImageUrls(post);
      // Skip posts that have neither caption nor any image — nothing to parse.
      if (imageUrls.length === 0 && caption.length === 0) continue;

      const externalId = post.id ? `apify-ig-${post.id}` : post.shortCode ? `apify-ig-${post.shortCode}` : undefined;

      messages.push({
        external_id: externalId,
        content_text: caption,
        image_urls: imageUrls.length > 0 ? imageUrls : undefined,
        sender_id: post.ownerUsername || post.ownerId || handles[0],
        sender_name: post.ownerUsername ? `@${post.ownerUsername}` : undefined,
        raw_data: { ...post, source_url: post.url ?? null },
      });
    }

    return messages;
  },
};

function collectImageUrls(post: ApifyPost): string[] {
  const urls: string[] = [];
  if (Array.isArray(post.images)) {
    for (const u of post.images) if (typeof u === "string" && u.length > 0) urls.push(u);
  }
  if (post.displayUrl && !urls.includes(post.displayUrl)) urls.push(post.displayUrl);
  return urls;
}

registerAdapter(apifyInstagramAdapter);

export { apifyInstagramAdapter };
