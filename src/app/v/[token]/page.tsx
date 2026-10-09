import type { Metadata } from "next";
import Link from "next/link";
import { Globe, Instagram, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { getInvite, type InviteDeal } from "@/lib/deals/invite";
import { formatDays, formatHours, formatIdr } from "@/lib/specials";
import { dealExamples } from "@/lib/deals/examples";
import { REVIEW_PROMISE } from "@/lib/venue";
import { InviteForm, FoundYes, OptOut } from "./invite-form";

export const metadata: Metadata = {
  title: "Your page on The Ubudian",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/** Email only (Ben, 7 Oct): no phone number on venue pages. */
const CONTACT_EMAIL = "theubudianlife@gmail.com";

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

const KIND: Record<string, string> = { cafe: "Café", restaurant: "Restaurant", warung: "Warung", bakery: "Bakery", spa: "Spa", yoga: "Yoga", bar: "Bar & kitchen" };
const kindOf = (c: string | null) => (c ? (KIND[c.toLowerCase()] ?? c.charAt(0).toUpperCase() + c.slice(1)) : null);

export default async function VenueInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await getInvite(token);
  if (!invite) notFound();
  const examples = dealExamples(invite.category);
  const hasDeal = invite.live.length + invite.found.length + invite.waiting.length > 0;

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

  const linkCls = "inline-flex items-center gap-1.5 underline-offset-4 hover:text-brand-deep-green hover:underline";
  return (
    <div>
      <section className="bg-brand-cream py-10 sm:py-12">
        <div className="mx-auto max-w-xl px-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-terracotta">
            {invite.contactName ? `For ${invite.contactName} · ` : ""}Your page on The Ubudian
          </p>
          <h1 className="mt-2 font-serif text-3xl font-medium text-brand-deep-green sm:text-4xl">{invite.name}</h1>
          <p className="mt-1 text-muted-foreground">{[kindOf(invite.category), invite.area].filter(Boolean).join(" · ")}</p>
          <p className="mt-4 text-brand-charcoal">
            The Ubudian is a website that helps people in Ubud decide where to eat and what to do this week. Its deals page shows offers from local places. Add your deal and it appears on your page and on the deals page.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-xl space-y-6 px-4 py-8">
        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">How guests will see you</p>
          <article className="rounded-xl border border-brand-gold/20 bg-card p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-terracotta">
              {invite.name}
              {invite.area ? <span className="font-normal normal-case tracking-normal text-muted-foreground"> · {invite.area}</span> : null}
            </p>
            {invite.live[0] ? (
              <h2 className="mt-1 font-serif text-xl text-brand-deep-green">{invite.live[0].title}</h2>
            ) : (
              <div className="mt-2 rounded-lg border-2 border-dashed border-brand-gold/50 px-3 py-2">
                <p className="font-serif text-lg text-brand-deep-green">Your guest deal here</p>
                <p className="text-sm text-muted-foreground">For example: {examples[0].charAt(0).toLowerCase() + examples[0].slice(1)}</p>
              </div>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <a href={invite.mapsUrl} target="_blank" rel="noopener noreferrer" className={linkCls}>
                <MapPin className="h-4 w-4" aria-hidden />
                Directions
              </a>
              {invite.instagramHandle ? (
                <a href={`https://instagram.com/${encodeURIComponent(invite.instagramHandle)}`} target="_blank" rel="noopener noreferrer" className={linkCls}>
                  <Instagram className="h-4 w-4" aria-hidden />@{invite.instagramHandle}
                </a>
              ) : invite.websiteUrl ? (
                <a href={invite.websiteUrl} target="_blank" rel="noopener noreferrer" className={linkCls}>
                  <Globe className="h-4 w-4" aria-hidden />
                  Website
                </a>
              ) : null}
            </div>
          </article>
        </div>

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
            Thank you: {invite.waiting.length === 1 ? "your deal is" : `${invite.waiting.length} deals are`} with us. {REVIEW_PROMISE}.
          </p>
        )}

        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-serif text-xl text-brand-deep-green">{hasDeal ? "Add another deal" : "Add your deal"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap an example or write your own. We list food, café and wellness deals that save guests at least 25% (no drink deals). Free: no fees, no commission. {REVIEW_PROMISE}.
          </p>
          <div className="mt-4">
            <InviteForm token={token} examples={examples} />
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Easier by email? Reply to our email, or write to{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`${invite.name} on The Ubudian`)}`}
            className="font-medium text-brand-deep-green underline underline-offset-4"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
        <p className="text-center text-sm text-muted-foreground">Gratis, tanpa komisi. Tanya? Email kami.</p>
        <OptOut token={token} />
        <p className="text-center text-xs text-muted-foreground">Only you have this link. Nothing shows on the site until you send a deal.</p>
      </section>
    </div>
  );
}
