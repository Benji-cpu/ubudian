import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getInvite, type InviteDeal } from "@/lib/deals/invite";
import { formatDays, formatHours, formatIdr } from "@/lib/specials";
import { InviteForm, FoundYes, OptOut } from "./invite-form";

export const metadata: Metadata = {
  title: "Your page on The Ubudian",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/** Ben's WhatsApp, shown only on these private pages (env, so the public repo never holds it). */
function whatsappHref(venue: string): string | null {
  const n = process.env.VENUE_CONTACT_WHATSAPP?.replace(/\D/g, "");
  if (!n) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(`Hi Ben, it's ${venue} about The Ubudian`)}`;
}

function when(d: InviteDeal): string {
  return [d.days_stated ? formatDays(d) : null, formatHours(d.start_time, d.end_time), formatIdr(d.price_idr)]
    .filter(Boolean)
    .join(" · ");
}

function DealBox({ d, children }: { d: InviteDeal; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-brand-gold/30 bg-card p-4">
      <p className="font-serif text-lg text-brand-deep-green">{d.title}</p>
      {when(d) && <p className="text-sm text-muted-foreground">{when(d)}</p>}
      {children}
    </div>
  );
}

const IDEAS: Record<string, string> = {
  cafe: "25% off breakfast before 9",
  warung: "a free dessert with nasi campur",
  restaurant: "2-for-1 mains on a quiet night",
  spa: "25% off weekday mornings",
  yoga: "a free class with a 5-class card",
  bar: "half-price food before 6",
};

export default async function VenueInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await getInvite(token);
  if (!invite) notFound();
  const wa = whatsappHref(invite.name);
  const idea = IDEAS[invite.category ?? ""] ?? IDEAS.restaurant;

  if (invite.optedOut) {
    return (
      <section className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="font-serif text-3xl text-brand-deep-green">Got it, {invite.name}</h1>
        <p className="mt-4 text-muted-foreground">We won&apos;t contact you again. If you change your mind, just add a deal below any time.</p>
        <div className="mt-8 text-left">
          <InviteForm token={token} />
        </div>
      </section>
    );
  }

  return (
    <div>
      <section className="bg-brand-cream px-4 py-12">
        <div className="mx-auto max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-terracotta">
            {invite.contactName ? `For ${invite.contactName} · ` : ""}Your private page
          </p>
          <h1 className="mt-2 font-serif text-3xl font-medium text-brand-deep-green sm:text-4xl">{invite.name} on The Ubudian</h1>
          <p className="mt-3 text-muted-foreground">
            The Ubudian is a free website that lists Ubud&apos;s food and wellness deals, on the days they run.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-xl space-y-6 px-4 py-10">
        {invite.live.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-serif text-xl text-brand-deep-green">Listed now</h2>
            {invite.live.map((d) => (
              <DealBox key={d.id} d={d} />
            ))}
            <Link
              href={`/tonight/confirm/${invite.live[0].confirm_token}`}
              className="inline-block text-sm font-medium text-brand-terracotta underline-offset-4 hover:underline"
            >
              Still right? Confirm, change or take down →
            </Link>
          </div>
        )}

        {invite.found.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-serif text-xl text-brand-deep-green">We saw this on your pages</h2>
            {invite.found.map((d) => (
              <DealBox key={d.id} d={d}>
                <FoundYes token={token} specialId={d.id} />
              </DealBox>
            ))}
          </div>
        )}

        {invite.waiting.length > 0 && (
          <p className="rounded-lg bg-muted p-3 text-sm">
            Thank you: {invite.waiting.length === 1 ? "your deal is" : `${invite.waiting.length} deals are`} with us. We check new deals every night; most are live by the next morning.
          </p>
        )}

        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-serif text-xl text-brand-deep-green">
            {invite.live.length + invite.found.length > 0 ? "Any other deals or specials?" : "What deals or specials do you run?"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Any day, any time. For example: {idea}. We list food, café and wellness deals that save at least 25% (no drink deals). Free: no fees, no commission, no ads.
          </p>
          <div className="mt-4">
            <InviteForm token={token} />
          </div>
        </div>

        {wa && (
          <a
            href={wa}
            className="block rounded-lg border border-brand-deep-green/30 p-3 text-center font-medium text-brand-deep-green"
          >
            Easier to chat? WhatsApp Ben
          </a>
        )}
        <p className="text-center text-sm text-muted-foreground">Gratis, tanpa komisi. Tanya? WhatsApp Ben.</p>
        <OptOut token={token} />
        <p className="text-center text-xs text-muted-foreground">Only you have this link. Nothing shows on the site until you send it.</p>
      </section>
    </div>
  );
}
