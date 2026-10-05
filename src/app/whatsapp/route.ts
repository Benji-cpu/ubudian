import { NextResponse } from "next/server";
import { WHATSAPP_CHANNEL_URL } from "@/lib/whatsapp/channel";

/**
 * theubudian.life/whatsapp → the WhatsApp Channel. Posters and the QR code
 * point here rather than at the channel itself, so print never goes stale.
 * Before the channel exists it lands on /deals instead of a dead end.
 */
export function GET(request: Request) {
  const target = WHATSAPP_CHANNEL_URL ?? new URL("/deals", request.url).toString();
  return NextResponse.redirect(target, 307);
}
