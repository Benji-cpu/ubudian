import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { queryWithRetry } from "@/lib/supabase/retry";
import { rolledForward } from "@/lib/events/buckets";
import { nowInBali } from "@/lib/events/bali-time";
import { stripEmbeddings } from "@/lib/events/strip-embedding";
import { visibleListings } from "@/lib/events/listing-checks";
import { getLiveSpecials } from "@/lib/specials/queries";
import { buildTodayPost, buildWeeklyPost } from "@/lib/whatsapp/weekly-post";
import {
  WHATSAPP_CHANNEL_URL,
  WHATSAPP_QR_PATH,
  WHATSAPP_SHORT_PATH,
} from "@/lib/whatsapp/channel";
import { CopyPost } from "@/components/whatsapp/copy-post";
import { SITE_URL } from "@/lib/constants";
import type { Event } from "@/types";

export const metadata: Metadata = { title: "WhatsApp channel | Admin" };
export const dynamic = "force-dynamic";

export default async function AdminWhatsAppPage() {
  const bali = nowInBali();
  const supabase = await createClient();
  const [specials, { data, error }] = await Promise.all([
    getLiveSpecials(),
    queryWithRetry(
      () =>
        supabase
          .from("events")
          .select("*")
          .eq("status", "approved")
          .or(`start_date.gte.${bali.dateStr},is_recurring.eq.true,end_date.gte.${bali.dateStr}`),
      "admin-whatsapp-events"
    ),
  ]);
  if (error) console.error("admin/whatsapp events:", error);

  const events = rolledForward(visibleListings(stripEmbeddings((data ?? []) as Event[])));
  const todayPost = buildTodayPost({ specials, events, now: bali, siteUrl: SITE_URL });
  const post = buildWeeklyPost({ specials, events, now: bali, siteUrl: SITE_URL });
  const shortLink = `${SITE_URL.replace(/^https?:\/\//, "")}${WHATSAPP_SHORT_PATH}`;

  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <h1 className="font-serif text-3xl">WhatsApp channel</h1>
        <p className="mt-2 text-muted-foreground">
          Ubud deals is a broadcast people follow, not a chat. Post from the WhatsApp
          Business app; the follower count is the interest signal.
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Status</h2>
        {WHATSAPP_CHANNEL_URL ? (
          <p>
            Live:{" "}
            <a href={WHATSAPP_CHANNEL_URL} className="underline underline-offset-4">
              {WHATSAPP_CHANNEL_URL}
            </a>
            . The follow box shows wherever <code>&lt;ChannelFollow /&gt;</code> is placed.
          </p>
        ) : (
          <p>
            Not live yet. Once the channel exists, its invite link goes in{" "}
            <code>src/lib/whatsapp/channel.ts</code>; until then {shortLink} goes to /deals and the
            follow box stays hidden.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Today&apos;s post</h2>
        <p className="text-sm text-muted-foreground">
          The deals still on today and today&apos;s gatherings, by Bali time, the same as /deals.
        </p>
        <CopyPost text={todayPost} label="Copy today's post" />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">This week&apos;s post</h2>
        <p className="text-sm text-muted-foreground">
          One deal per venue (the weekly email&apos;s pick) and the next 7 days of gatherings. Copy,
          then paste it into the channel.
        </p>
        <CopyPost text={post} label="Copy this week's post" />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">QR code for posters</h2>
        {WHATSAPP_CHANNEL_URL ? (
          <>
            <p className="text-sm text-muted-foreground">
              Points at {shortLink}, so printed copies keep working whatever happens to the channel.
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element -- static SVG */}
            <img src={WHATSAPP_QR_PATH} alt="" width={200} height={200} className="rounded-lg bg-white p-2" />
            <a href={WHATSAPP_QR_PATH} download="ubudian-whatsapp-qr.svg" className="text-sm underline underline-offset-4">
              Download the SVG
            </a>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Appears once the channel is live. Until then {shortLink} opens /deals, so a &quot;Follow on
            WhatsApp&quot; poster would land on a web page.
          </p>
        )}
      </section>
    </div>
  );
}
