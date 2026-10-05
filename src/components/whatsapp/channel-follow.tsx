import { MessageCircle } from "lucide-react";
import { isChannelLive, WHATSAPP_QR_PATH, WHATSAPP_SHORT_PATH } from "@/lib/whatsapp/channel";

/**
 * "Follow Ubud deals on WhatsApp". Renders nothing until the channel
 * exists (`WHATSAPP_CHANNEL_URL`), so it can sit on any page ahead of time.
 * On a phone it's one tap; on a desktop the QR code is the way across.
 */
export function ChannelFollow({ className = "" }: { className?: string }) {
  if (!isChannelLive()) return null;

  return (
    <div
      className={`flex items-center gap-5 rounded-2xl border border-brand-gold/30 bg-card p-5 text-left ${className}`}
    >
      <div className="min-w-0 flex-1">
        <p className="font-serif text-xl text-brand-deep-green dark:text-brand-gold">
          Get Ubud deals on WhatsApp
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Follow the channel for the best deals and what&apos;s on. It isn&apos;t a group chat, and
          nobody sees your number.
        </p>
        <a
          href={WHATSAPP_SHORT_PATH}
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#25D366] px-5 text-sm font-semibold text-[#0b3d1f] transition-opacity hover:opacity-90"
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          Follow on WhatsApp
        </a>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- static SVG, images are unoptimized anyway */}
      <img
        src={WHATSAPP_QR_PATH}
        alt="QR code to follow Ubud deals on WhatsApp"
        width={112}
        height={112}
        className="hidden shrink-0 rounded-lg bg-white p-1.5 sm:block"
      />
    </div>
  );
}
