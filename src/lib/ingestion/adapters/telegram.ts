/**
 * Telegram Bot adapter for event ingestion.
 *
 * Receives messages from Ubud community Telegram groups via webhook,
 * extracts text and photo content, and feeds into the ingestion pipeline.
 */

import type { SourceAdapter, RawMessage } from "../types";
import { registerAdapter } from "../source-adapter";

/**
 * Extract file URL from Telegram Bot API using getFile endpoint.
 */
export async function getTelegramFileUrl(fileId: string): Promise<string | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
    const data = await res.json();

    if (data.ok && data.result?.file_path) {
      return `https://api.telegram.org/file/bot${token}/${data.result.file_path}`;
    }
  } catch (err) {
    console.error("[telegram] Failed to get file URL:", err);
  }

  return null;
}

/**
 * Extract relevant data from a Telegram webhook update.
 */
export async function parseTelegramUpdate(update: TelegramUpdate): Promise<RawMessage | null> {
  const message = update.message || update.channel_post;
  if (!message) return null;

  const text = message.text || message.caption || "";
  const imageUrls: string[] = [];

  // Extract highest-resolution photo
  if (message.photo && message.photo.length > 0) {
    // Photos come sorted by size, last is highest resolution
    const largestPhoto = message.photo[message.photo.length - 1];
    const url = await getTelegramFileUrl(largestPhoto.file_id);
    if (url) imageUrls.push(url);
  }

  // Extract document images (sometimes flyers are sent as documents)
  if (message.document?.mime_type?.startsWith("image/")) {
    const url = await getTelegramFileUrl(message.document.file_id);
    if (url) imageUrls.push(url);
  }

  // Skip very short messages with no images (likely not events)
  if (text.length < 20 && imageUrls.length === 0) {
    return null;
  }

  return {
    external_id: String(message.message_id),
    content_text: text,
    image_urls: imageUrls.length > 0 ? imageUrls : undefined,
    sender_name: message.from
      ? [message.from.first_name, message.from.last_name].filter(Boolean).join(" ")
      : undefined,
    sender_id: message.from ? String(message.from.id) : undefined,
    chat_name: message.chat.title || undefined,
    raw_data: update,
  };
}

/**
 * Download media from a Telegram file URL.
 * Returns the raw image buffer and content type, or null on failure.
 *
 * Telegram file URLs are self-authenticating (token is embedded in the URL),
 * so no extra auth headers are needed.
 */
export async function downloadTelegramMedia(
  url: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  if (!url) return null;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      console.error(
        `[telegram] Failed to download media: ${res.status} ${res.statusText}`
      );
      return null;
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await res.arrayBuffer();
    return { buffer: Buffer.from(arrayBuffer), contentType };
  } catch (err) {
    console.error("[telegram] Error downloading media:", err);
    return null;
  }
}

/**
 * Telegram source adapter.
 *
 * Note: Telegram uses a push model (webhooks), not polling.
 * The fetchMessages method is not used for normal operation —
 * messages are pushed via the webhook route and processed immediately.
 * This adapter exists mainly for the registry and any future polling needs.
 */
const telegramAdapter: SourceAdapter = {
  sourceSlug: "telegram",

  async fetchMessages(
    _config: Record<string, unknown>,
    _since?: Date
  ): Promise<RawMessage[]> {
    // Telegram is push-based via webhook — this method is a no-op.
    // Messages are received and processed in /api/webhooks/telegram/route.ts
    return [];
  },
};

registerAdapter(telegramAdapter);

// ============================================
// Telegram API types (subset we use)
// ============================================

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  channel_post?: TelegramMessage;
}

export interface TelegramMessage {
  message_id: number;
  from?: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  chat: {
    id: number;
    type: "private" | "group" | "supergroup" | "channel";
    title?: string;
  };
  date: number;
  text?: string;
  caption?: string;
  photo?: TelegramPhotoSize[];
  document?: {
    file_id: string;
    file_unique_id: string;
    file_name?: string;
    mime_type?: string;
  };
}

export interface TelegramPhotoSize {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
}
