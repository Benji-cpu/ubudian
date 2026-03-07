/**
 * WAHA (WhatsApp HTTP API) adapter.
 *
 * Receives messages via WAHA webhook — a self-hosted Docker service
 * that wraps WhatsApp Web's Linked Devices protocol into REST + webhooks.
 *
 * Push-based: messages arrive via webhook POST, fetchMessages() is a no-op.
 */

import type { SourceAdapter, RawMessage } from "../types";
import { registerAdapter } from "../source-adapter";

// ============================================
// WAHA webhook types
// ============================================

export interface WahaWebhookPayload {
  event:
    | "message"
    | "message.ack"
    | "session.status"
    | "message.waiting"
    | "poll.vote";
  session: string;
  engine: string;
  payload: {
    id: string;
    timestamp: number;
    from: string;
    to: string;
    participant?: string;
    fromMe: boolean;
    body: string;
    hasMedia: boolean;
    mediaUrl?: string;
    ack: number;
    type?: "chat" | "image" | "video" | "document" | "audio";
    caption?: string;
  };
}

/**
 * Parse a WAHA webhook payload into a RawMessage.
 * Returns null if the message should be skipped.
 */
export function parseWahaWebhook(
  payload: WahaWebhookPayload
): RawMessage | null {
  // Only process "message" events
  if (payload.event !== "message") return null;

  const msg = payload.payload;

  // Skip messages we sent ourselves
  if (msg.fromMe) return null;

  // Skip non-group messages (group IDs end with @g.us)
  if (!msg.from.endsWith("@g.us")) return null;

  // Extract text content — use caption for media messages, body otherwise
  const contentText = msg.caption || msg.body || "";

  // Determine if this has an image
  const hasImage = msg.hasMedia && (msg.type === "image" || !msg.type);

  // Skip very short messages with no media
  if (contentText.length < 20 && !hasImage) return null;

  // Sender: use participant (the actual sender in a group), fallback to from
  const senderId = msg.participant || msg.from;
  // Clean sender ID: strip @c.us suffix for display
  const senderName = senderId.replace("@c.us", "");

  return {
    external_id: msg.id,
    content_text: contentText,
    image_urls: undefined, // Media URLs are handled in the webhook route (download → upload)
    sender_name: senderName,
    sender_id: senderId,
    raw_data: payload,
  };
}

/**
 * Download media from the WAHA server.
 * Returns the raw image buffer and content type, or null on failure.
 */
export async function downloadWahaMedia(
  mediaUrl: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const apiKey = process.env.WAHA_API_KEY;
  if (!apiKey || !mediaUrl) return null;

  try {
    const res = await fetch(mediaUrl, {
      headers: { "X-Api-Key": apiKey },
    });

    if (!res.ok) {
      console.error(
        `[waha] Failed to download media: ${res.status} ${res.statusText}`
      );
      return null;
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await res.arrayBuffer();
    return { buffer: Buffer.from(arrayBuffer), contentType };
  } catch (err) {
    console.error("[waha] Error downloading media:", err);
    return null;
  }
}

/**
 * Verify the WAHA webhook secret header.
 */
export function verifyWahaWebhookSecret(
  headerSecret: string | null
): boolean {
  const expectedSecret = process.env.WAHA_WEBHOOK_SECRET;
  if (!expectedSecret) return false;
  return headerSecret === expectedSecret;
}

// ============================================
// Adapter registration
// ============================================

const whatsappAdapter: SourceAdapter = {
  sourceSlug: "whatsapp",

  async fetchMessages(): Promise<RawMessage[]> {
    // WAHA is push-based via webhook — this is a no-op
    return [];
  },
};

registerAdapter(whatsappAdapter);
