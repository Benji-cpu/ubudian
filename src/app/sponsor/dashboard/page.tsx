import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, BarChart3 } from "lucide-react";
import { SponsorSubscribeRow } from "@/components/sponsors/sponsor-subscribe-row";
import { SponsorSelfEditForm } from "@/components/sponsors/sponsor-self-edit-form";
import { SPONSOR_TIER_PRICE_LABEL } from "@/lib/stripe/sponsor-pricing";
import type { Sponsor, Sponsorship } from "@/types";

export const metadata: Metadata = {
  title: "Partner Dashboard | The Ubudian",
};

const TIER_NAME: Record<Sponsor["tier"], string> = {
  patron: "Patron",
  partner: "Partner",
  anchor: "Anchor",
};

export default async function SponsorDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ subscribed?: string; cancelled?: string }>;
}) {
  const sp = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login?redirect=/sponsor/dashboard");
  }

  const admin = createAdminClient();
  const { data: sponsorRow } = await admin
    .from("sponsors")
    .select("*")
    .eq("claimed_by_profile_id", profile.id)
    .maybeSingle();

  if (!sponsorRow) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
        <h1 className="font-serif text-3xl font-bold text-brand-deep-green">
          Your account isn&apos;t linked to a partner profile
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          We connect a community partner profile to a logged-in account manually so we
          know it&apos;s really you. Drop us a line — once your profile is created on
          our side, we&apos;ll link it to this email{" "}
          <strong className="text-foreground">{profile.email}</strong> and you&apos;ll
          land here next time.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/partners">Get in touch</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/community/partners">See the directory</Link>
          </Button>
        </div>
      </div>
    );
  }

  const sponsor = sponsorRow as Sponsor;

  // Active placements attached to this sponsor.
  const nowIso = new Date().toISOString();
  const { data: placementsRows } = await admin
    .from("sponsorships")
    .select("*")
    .eq("sponsor_id", sponsor.id)
    .lte("starts_at", nowIso)
    .or(`ends_at.is.null,ends_at.gt.${nowIso}`)
    .order("starts_at", { ascending: false });
  const placements = (placementsRows ?? []) as Sponsorship[];

  // Rolling 30-day impression + view counts.
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: events30 } = await admin
    .from("sponsorship_events")
    .select("event_type")
    .eq("sponsor_id", sponsor.id)
    .gte("created_at", thirtyDaysAgo);
  const counts = (events30 ?? []).reduce(
    (acc, row) => {
      const type = (row as { event_type: string }).event_type;
      acc[type] = (acc[type] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <header className="border-b border-brand-gold/20 pb-6">
        <p className="font-serif text-sm uppercase tracking-[0.25em] text-brand-gold">
          Partner Dashboard
        </p>
        <h1 className="mt-2 font-serif text-3xl font-bold text-brand-deep-green md:text-4xl">
          {sponsor.name}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <Badge variant="outline">{TIER_NAME[sponsor.tier]}</Badge>
          <Badge variant={sponsor.status === "active" ? "default" : "secondary"}>
            {sponsor.status === "active"
              ? "Active"
              : sponsor.status === "paused"
              ? "Paused"
              : "Ended"}
          </Badge>
          {sponsor.stripe_subscription_status && (
            <span className="text-xs text-muted-foreground">
              Stripe: {sponsor.stripe_subscription_status}
            </span>
          )}
        </div>
      </header>

      {sp.subscribed === "true" && (
        <div className="mt-6 rounded-md border border-brand-gold/30 bg-brand-cream/50 p-4 text-sm">
          Subscription started. It can take a moment for the status above to update.
        </div>
      )}
      {sp.cancelled === "true" && (
        <div className="mt-6 rounded-md border border-muted bg-muted/30 p-4 text-sm text-muted-foreground">
          Checkout cancelled — no charges were made.
        </div>
      )}

      {/* Subscription state */}
      <section className="mt-10">
        <h2 className="font-serif text-xl text-brand-deep-green">Subscription</h2>
        <div className="mt-4">
          <SponsorSubscribeRow
            sponsorId={sponsor.id}
            tier={sponsor.tier}
            tierLabel={TIER_NAME[sponsor.tier]}
            tierPriceLabel={SPONSOR_TIER_PRICE_LABEL[sponsor.tier]}
            hasSubscription={!!sponsor.stripe_subscription_id}
            subscriptionStatus={sponsor.stripe_subscription_status}
          />
        </div>
      </section>

      {/* Analytics card */}
      <section className="mt-12">
        <h2 className="font-serif text-xl text-brand-deep-green">Last 30 days</h2>
        <div className="mt-4 grid grid-cols-3 divide-x divide-brand-gold/15 rounded-md border border-brand-gold/15 bg-brand-cream/30">
          <Stat label="Event impressions" value={counts.event_impression ?? 0} />
          <Stat label="Profile views" value={counts.profile_view ?? 0} />
          <Stat label="Profile clicks" value={counts.partner_click ?? 0} />
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <BarChart3 className="h-3.5 w-3.5" />
          Counts dedupe per visitor/day. Click-through tracking is best-effort.
        </p>
      </section>

      {/* Active placements */}
      <section className="mt-12">
        <h2 className="font-serif text-xl text-brand-deep-green">Active placements</h2>
        {placements.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No placements attached yet. We&apos;ll wire these up as your bookings, events, and
            editions roll forward.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-brand-gold/15 rounded-md border border-brand-gold/15">
            {placements.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="capitalize">{p.entity_type.replace("_", " ")}</span>
                <span className="text-xs text-muted-foreground">
                  since {new Date(p.starts_at).toLocaleDateString("en-GB")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Self-edit form */}
      <section className="mt-12">
        <h2 className="font-serif text-xl text-brand-deep-green">Partner profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Edits show on{" "}
          <Link
            href={`/community/partners/${sponsor.slug}`}
            className="underline decoration-brand-gold/40 underline-offset-4"
          >
            your public profile
          </Link>
          . Tier and category changes go through us — message Benji.
        </p>
        <div className="mt-6">
          <SponsorSelfEditForm sponsor={sponsor} />
        </div>
      </section>

      <p className="mt-16 flex items-center gap-1.5 text-xs text-muted-foreground">
        <ExternalLink className="h-3.5 w-3.5" />
        <Link
          href={`/community/partners/${sponsor.slug}`}
          className="underline decoration-brand-gold/30 underline-offset-2"
        >
          View your public profile
        </Link>
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-4 py-5 text-center">
      <p className="font-serif text-2xl font-bold text-brand-deep-green">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
