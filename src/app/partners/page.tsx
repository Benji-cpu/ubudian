import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SponsorLeadForm } from "@/components/partners/sponsor-lead-form";

export const metadata: Metadata = {
  title: "Become a Community Partner | The Ubudian",
  description:
    "Yoga studios, ceremony spaces, healers, restaurants, villas — partner with The Ubudian to reach Ubud's conscious community through editorial placements, not ads.",
};

const TIERS: {
  key: "patron" | "partner" | "anchor";
  name: string;
  price: string;
  audience: string;
  features: string[];
  highlight?: boolean;
}[] = [
  {
    key: "patron",
    name: "Patron",
    price: "$75/mo",
    audience: "Solo practitioners, single-treatment healers, boutique classes",
    features: [
      "Profile in the public Community Partners directory",
      "One newsletter mention per quarter",
      "Listing in the relevant event-category footer",
    ],
  },
  {
    key: "partner",
    name: "Partner",
    price: "$300/mo",
    audience: "Tantra facilitators, breathwork + sound healers, retreat centres",
    features: [
      "Everything in Patron",
      "Monthly newsletter feature",
      "Boost up to 4 events per month — top-of-listing placement",
      '"In partnership with" credit on those event detail pages',
    ],
    highlight: true,
  },
  {
    key: "anchor",
    name: "Anchor",
    price: "$750/mo",
    audience: "Conscious wellness studios + ceremony venues, signature villas",
    features: [
      "Everything in Partner",
      "Own one category — Dance, Tantra, Ceremony, Sound, Healing",
      "One dedicated newsletter edition per quarter",
      "Featured placement in two journey itineraries per quarter",
    ],
  },
];

async function getAudienceSnapshot() {
  try {
    const supabase = await createClient();
    const [subRes, eventsRes, sponsorsRes] = await Promise.all([
      supabase
        .from("newsletter_subscribers")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("status", "approved")
        .gte("start_date", new Date().toISOString().split("T")[0]),
      supabase
        .from("sponsors")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
    ]);
    return {
      subscribers: subRes.count ?? 0,
      upcomingEvents: eventsRes.count ?? 0,
      activePartners: sponsorsRes.count ?? 0,
    };
  } catch {
    return { subscribers: 0, upcomingEvents: 0, activePartners: 0 };
  }
}

export default async function PartnersPitchPage() {
  const audience = await getAudienceSnapshot();

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="max-w-3xl">
        <p className="font-serif text-sm uppercase tracking-[0.25em] text-brand-gold">
          Become a Community Partner
        </p>
        <h1 className="mt-4 font-serif text-4xl font-bold text-brand-deep-green md:text-5xl">
          Reach Ubud&apos;s conscious community — without sounding like an ad
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          The Ubudian is the editorial home for Ubud&apos;s tantra, ceremony,
          ecstatic dance and embodiment scene. Community Partners help sustain
          the platform in exchange for editorial-grade placements — never
          banner ads, never "Sponsored" tags. If your work belongs in this
          field, we&apos;d love to hold it with you.
        </p>
      </header>

      {/* Audience snapshot */}
      <section className="mt-12 grid grid-cols-3 divide-x divide-brand-gold/20 rounded-md border border-brand-gold/20 bg-brand-cream/40">
        <Stat label="Newsletter readers" value={fmt(audience.subscribers)} />
        <Stat label="Upcoming events" value={fmt(audience.upcomingEvents)} />
        <Stat label="Active partners" value={fmt(audience.activePartners)} />
      </section>

      {/* Tiers */}
      <section className="mt-16">
        <h2 className="font-serif text-2xl font-medium text-brand-deep-green">
          Three ways to be held in the field
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Bundles, not à-la-carte. Pricing reflects placement intensity, not impressions.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {TIERS.map((t) => (
            <Card
              key={t.key}
              className={
                t.highlight
                  ? "relative border-brand-gold/60 shadow-lg"
                  : "border-brand-gold/20"
              }
            >
              {t.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-brand-gold px-3 py-0.5 text-xs font-medium text-white">
                    Most chosen
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="font-serif text-xl text-brand-deep-green">
                  {t.name}
                </CardTitle>
                <p className="text-2xl font-bold text-brand-terracotta">{t.price}</p>
                <p className="mt-2 text-xs italic text-muted-foreground">{t.audience}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm leading-relaxed">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Editorial standards */}
      <section className="mt-16 rounded-md bg-brand-cream/60 p-8 sm:p-10">
        <h2 className="font-serif text-2xl font-medium text-brand-deep-green">
          What we promise the reader
        </h2>
        <ul className="mt-5 space-y-3 text-sm leading-relaxed text-foreground/90">
          <li>
            <strong className="font-medium">No banner ads, no &quot;Sponsored&quot; tags.</strong>{" "}
            Every credit reads &quot;In partnership with X&quot; or &quot;This edition held by X.&quot;
          </li>
          <li>
            <strong className="font-medium">One credit per surface, maximum.</strong>{" "}
            We never stack two partner mentions on a single page.
          </li>
          <li>
            <strong className="font-medium">Boosted events look identical to organic ones.</strong>{" "}
            No badge, no gold border — just top placement. Reader trust before revenue.
          </li>
          <li>
            <strong className="font-medium">We curate.</strong> Anchor categories are sold to one
            partner at a time. Saying no is part of the offer.
          </li>
        </ul>
      </section>

      {/* Lead form */}
      <section className="mt-16">
        <div className="max-w-2xl">
          <h2 className="font-serif text-2xl font-medium text-brand-deep-green">
            Get in touch
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Tell us about your work and which tier feels right. We&apos;ll reply within a
            few days. No payment yet — this is the start of a conversation.
          </p>
        </div>
        <div className="mt-8 max-w-2xl">
          <SponsorLeadForm />
        </div>
      </section>

      <p className="mt-16 text-sm text-muted-foreground">
        Already a partner?{" "}
        <Link
          href="/sponsor/dashboard"
          className="underline decoration-brand-gold/40 underline-offset-4 hover:decoration-brand-gold"
        >
          Sign in to manage your placement
        </Link>
        .
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-6 text-center">
      <p className="font-serif text-3xl font-bold text-brand-deep-green">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toString();
}
