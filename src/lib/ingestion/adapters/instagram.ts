/**
 * Instagram adapter.
 *
 * Fetches recent posts from Instagram Business accounts that post event info.
 * Uses Instagram Basic Display API / Graph API.
 *
 * Limited by design — Instagram doesn't have a dedicated events API.
 * Posts are sent through the LLM to determine if they're event announcements.
 */

import type { SourceAdapter, RawMessage } from "../types";
import { registerAdapter } from "../source-adapter";

const GRAPH_API_BASE = "https://graph.facebook.com/v18.0";

const instagramAdapter: SourceAdapter = {
  sourceSlug: "instagram",

  async fetchMessages(
    config: Record<string, unknown>,
    _since?: Date
  ): Promise<RawMessage[]> {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error("INSTAGRAM_ACCESS_TOKEN is not configured");
    }

    // Instagram Business Account IDs to monitor
    const accountIds = (config.account_ids as string[]) || [];
    if (accountIds.length === 0) {
      console.warn("[instagram] No account_ids configured");
      return [];
    }

    const allMessages: RawMessage[] = [];

    for (const accountId of accountIds) {
      try {
        const res = await fetch(
          `${GRAPH_API_BASE}/${accountId}/media?fields=id,caption,media_type,media_url,timestamp,permalink&limit=20&access_token=${accessToken}`
        );

        if (!res.ok) {
          console.error(`[instagram] Failed to fetch media for ${accountId}: ${res.status}`);
          continue;
        }

        const data = await res.json();
        const posts: IGPost[] = data.data || [];

        for (const post of posts) {
          const caption = post.caption || "";

          // Skip posts without meaningful captions
          if (caption.length < 30) continue;

          const imageUrls: string[] = [];
          if (post.media_url && (post.media_type === "IMAGE" || post.media_type === "CAROUSEL_ALBUM")) {
            imageUrls.push(post.media_url);
          }

          allMessages.push({
            external_id: `ig-${post.id}`,
            content_text: caption,
            image_urls: imageUrls.length > 0 ? imageUrls : undefined,
            sender_id: accountId,
            raw_data: post,
          });
        }
      } catch (err) {
        console.error(`[instagram] Error fetching account ${accountId}:`, err);
      }
    }

    return allMessages;
  },
};

interface IGPost {
  id: string;
  caption?: string;
  media_type?: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  timestamp?: string;
  permalink?: string;
}

registerAdapter(instagramAdapter);
