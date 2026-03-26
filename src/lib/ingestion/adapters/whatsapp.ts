/**
 * WAHA (WhatsApp HTTP API) adapter.
 *
 * Dual-mode: receives messages via WAHA webhook (push) AND polls via
 * WAHA REST API (pull) on cron. Both paths produce the same external_id
 * so the pipeline's dedup prevents double-processing.
 */

import type { SourceAdapter, RawMessage } from "../types";
import { registerAdapter } from "../source-adapter";
import { createAdminClient } from "@/lib/supabase/admin";

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
    chat_name: msg.from, // Group ID as fallback — webhook payloads don't include group names
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
// WAHA REST API types (different from webhook)
// ============================================

interface WahaRestMessage {
  id: string;
  timestamp: number;
  from: string;
  to: string;
  participant?: string;
  fromMe: boolean;
  body: string;
  hasMedia: boolean;
  type?: string;
  _data?: {
    type?: string;
    caption?: string;
    notifyName?: string;
  };
  media?: {
    url: string;
    mimetype?: string;
  };
}

interface WahaChat {
  id: string | { _serialized: string; [key: string]: unknown };
  name?: string;
  isGroup?: boolean;
}

// ============================================
// WAHA REST API helpers
// ============================================

/** Normalise a WAHA chat id which may arrive as a string or as an object with `_serialized`. */
function wahaChatId(raw: WahaChat["id"]): string {
  if (typeof raw === "object" && raw !== null) return raw._serialized ?? String(raw);
  return String(raw ?? "");
}

const WAHA_FETCH_HEADERS = () => {
  const apiKey = process.env.WAHA_API_KEY;
  return {
    "X-Api-Key": apiKey || "",
    "Content-Type": "application/json",
  };
};

/**
 * Fetch list of group chats from WAHA REST API.
 */
/** WahaChat with the id normalised to a plain string. */
type NormalisedChat = Omit<WahaChat, "id"> & { id: string };

async function fetchGroupChats(): Promise<NormalisedChat[]> {
  const baseUrl = process.env.WAHA_API_URL;
  if (!baseUrl) {
    console.error("[waha-poll] WAHA_API_URL not configured");
    return [];
  }

  try {
    const res = await fetch(`${baseUrl}/api/default/chats`, {
      headers: WAHA_FETCH_HEADERS(),
    });

    if (!res.ok) {
      console.error(`[waha-poll] Failed to fetch chats: ${res.status} ${res.statusText}`);
      return [];
    }

    const chats: WahaChat[] = await res.json();
    return chats
      .filter((c) => wahaChatId(c.id).endsWith("@g.us"))
      .map((c) => ({ ...c, id: wahaChatId(c.id) }));
  } catch (err) {
    console.error("[waha-poll] Error fetching chats:", err);
    return [];
  }
}

/**
 * Fetch recent messages from a single chat via WAHA REST API.
 */
async function fetchChatMessages(chatId: string, limit = 100): Promise<WahaRestMessage[]> {
  const baseUrl = process.env.WAHA_API_URL;
  if (!baseUrl) return [];

  try {
    const res = await fetch(
      `${baseUrl}/api/default/chats/${encodeURIComponent(chatId)}/messages?limit=${limit}&downloadMedia=true`,
      { headers: WAHA_FETCH_HEADERS() }
    );

    if (!res.ok) {
      console.error(`[waha-poll] Failed to fetch messages for ${chatId}: ${res.status}`);
      return [];
    }

    return await res.json();
  } catch (err) {
    console.error(`[waha-poll] Error fetching messages for ${chatId}:`, err);
    return [];
  }
}

/**
 * Download media from WAHA server and upload to Supabase Storage.
 * Returns the public URL, or null on failure.
 */
async function downloadAndUploadMedia(
  mediaUrl: string,
  messageId: string
): Promise<string | null> {
  const media = await downloadWahaMedia(mediaUrl);
  if (!media) return null;

  const supabase = createAdminClient();
  const ext = media.contentType.includes("png") ? "png" : "jpg";
  const filename = `ingestion/${Date.now()}-${messageId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("images")
    .upload(filename, media.buffer, {
      contentType: media.contentType,
      upsert: false,
    });

  if (uploadError) {
    console.error("[waha-poll] Storage upload error:", uploadError);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(filename);
  return publicUrl;
}

/**
 * Convert a WAHA REST API message to a RawMessage.
 * Shapes raw_data to match WahaWebhookPayload format so the admin UI
 * (which reads raw_data.payload.from) works for both webhook and polled messages.
 */
function wahaRestMessageToRawMessage(
  msg: WahaRestMessage,
  chatId: string,
  imageUrl?: string | null,
  chatName?: string
): RawMessage {
  // REST API: text is in body, caption for images is in _data.caption
  const contentText = msg._data?.caption || msg.body || "";

  // Sender: use participant (actual sender in group), fallback to from
  const senderId = msg.participant || msg.from;
  // Use notifyName from REST API, fall back to cleaned sender ID
  const senderName =
    msg._data?.notifyName ||
    senderId.replace("@c.us", "").replace("@lid", "");

  // Shape raw_data to match WahaWebhookPayload so admin UI works
  const webhookShapedPayload: WahaWebhookPayload = {
    event: "message",
    session: "default",
    engine: "WEBJS",
    payload: {
      id: msg.id,
      timestamp: msg.timestamp,
      from: chatId,
      to: msg.to || "",
      participant: msg.participant,
      fromMe: msg.fromMe,
      body: contentText,
      hasMedia: msg.hasMedia,
      mediaUrl: msg.media?.url,
      ack: 0,
      type: (msg._data?.type as WahaWebhookPayload["payload"]["type"]) || "chat",
      caption: msg._data?.caption,
    },
  };

  return {
    external_id: msg.id,
    content_text: contentText,
    image_urls: imageUrl ? [imageUrl] : undefined,
    sender_name: senderName,
    sender_id: senderId,
    chat_name: chatName || chatId,
    raw_data: webhookShapedPayload,
  };
}

// ============================================
// Adapter registration
// ============================================

const whatsappAdapter: SourceAdapter = {
  sourceSlug: "whatsapp",

  async fetchMessages(
    config: Record<string, unknown>,
    since?: Date
  ): Promise<RawMessage[]> {
    const baseUrl = process.env.WAHA_API_URL;
    const apiKey = process.env.WAHA_API_KEY;

    if (!baseUrl || !apiKey) {
      console.warn("[waha-poll] WAHA_API_URL or WAHA_API_KEY not configured, skipping poll");
      return [];
    }

    // Default to 4 hours ago if no since (first run safety)
    const sinceTs = since
      ? Math.floor(since.getTime() / 1000)
      : Math.floor((Date.now() - 4 * 60 * 60 * 1000) / 1000);

    console.log(`[waha-poll] Polling messages since ${new Date(sinceTs * 1000).toISOString()}`);

    // Fetch all group chats
    const groups = await fetchGroupChats();
    if (groups.length === 0) {
      console.log("[waha-poll] No group chats found");
      return [];
    }

    // Filter by allowed_groups config (empty = all groups)
    const allowedGroups = config.allowed_groups as string[] | undefined;
    const filteredGroups = allowedGroups?.length
      ? groups.filter((g) => allowedGroups.includes(g.id))
      : groups;

    console.log(
      `[waha-poll] Processing ${filteredGroups.length}/${groups.length} groups` +
      (allowedGroups?.length ? ` (filtered by allowed_groups)` : "")
    );

    const rawMessages: RawMessage[] = [];

    for (const group of filteredGroups) {
      const messages = await fetchChatMessages(group.id);

      for (const msg of messages) {
        // Skip own messages
        if (msg.fromMe) continue;

        // Skip messages before since timestamp
        if (msg.timestamp < sinceTs) continue;

        // Determine content and media
        const contentText = msg._data?.caption || msg.body || "";
        const msgType = msg._data?.type || msg.type;
        const isImage = msgType === "image";

        // Skip short messages with no image
        if (contentText.length < 20 && !isImage) continue;

        // Download and upload media if present
        let imageUrl: string | null = null;
        if (isImage && msg.media?.url) {
          imageUrl = await downloadAndUploadMedia(msg.media.url, msg.id);
        }

        rawMessages.push(
          wahaRestMessageToRawMessage(msg, group.id, imageUrl, group.name)
        );
      }
    }

    console.log(`[waha-poll] Fetched ${rawMessages.length} messages from ${filteredGroups.length} groups`);
    return rawMessages;
  },
};

registerAdapter(whatsappAdapter);
