/**
 * The Ubudian's WhatsApp Channel ("Ubud deals"): a broadcast people follow,
 * not a chat. Nobody messages The Ubudian through it (Ben, 5 Oct 2026), and the
 * follower count is the interest signal.
 *
 * Switch-on is this one line: paste the channel's invite link
 * (https://whatsapp.com/channel/…) and push. Until then every surface that
 * links to the channel renders nothing, and /whatsapp falls back to /deals.
 */
export const WHATSAPP_CHANNEL_URL: string | null = null;

/**
 * What posters, flyers and the site point at. A redirect of our own, so a
 * printed QR code keeps working if the channel ever changes.
 */
export const WHATSAPP_SHORT_PATH = "/whatsapp";

/** The QR code for `https://theubudian.life/whatsapp`, served from /public. */
export const WHATSAPP_QR_PATH = "/whatsapp-qr.svg";

export function isChannelLive(): boolean {
  return WHATSAPP_CHANNEL_URL !== null;
}
