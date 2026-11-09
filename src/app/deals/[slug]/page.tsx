import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock, Globe, Instagram, MapPin } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { NewsletterSignup } from "@/components/layout/newsletter-signup";
import { SpecialCard } from "@/components/specials/special-card";
import { DealShare } from "@/components/specials/deal-share";
import { DealPageTracker } from "@/components/specials/deal-page-tracker";
import { nowInBali } from "@/lib/events/bali-time";
import { dealTitle } from "@/lib/email/weekly-deals";
import { formatDays, formatHours } from "@/lib/specials";
import { getLiveSpecials } from "@/lib/specials/queries";
import {
  checkedLine,
  dealPageDescription,
  dealPageTitle,
  dealsForVenue,
  howToUse,
  mapsHref,
  moreDeals,
  offerLine,
  savingText,
  sharedCheckedLine,
  soonestFirst,
  venueInUbud,
} from "@/lib/specials/deal-page";
import { isSafeUrl } from "@/lib/url-validation";
import { SITE_URL } from "@/lib/constants";
import type { Special } from "@/types";

// A deal lapses on its date, so never serve a copy that could still show it.
export const dynamic = "force-dynamic";

interface DealPageProps {
  params: Promise<{ slug: string }>;
}

// The metadata and the page share one read per request.
const liveDeals = cache(getLiveSpecials);

export async function generateMetadata({ params }: DealPageProps): Promise<Metadata> {
  const { slug } = await params;
  const deals = dealsForVenue(await liveDeals(), slug);
  if (deals.length === 0) return { title: "Deal not found", robots: { index: false } };

  const title = dealPageTitle(deals);
  const description = dealPageDescription(deals);
  const url = `${SITE_URL}/deals/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", siteName: "The Ubudian" },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** The first row that has it: venue fields are the same on every deal, but one row may be missing a link. */
function venueField(deals: Special[], key: "google_maps_url" | "instagram_handle" | "website_url" | "venue_area" | "venue_address") {
  return deals.map((d) => d[key]?.trim()).find(Boolean) ?? null;
}

export default async function DealPage({ params }: DealPageProps) {
  const { slug } = await params;
  const all = await liveDeals();
  const deals = soonestFirst(dealsForVenue(all, slug), nowInBali().dayOfWeek);
  if (deals.length === 0) notFound();

  const venueName = deals[0].venue_name;
  const area = venueField(deals, "venue_area");
  const handle = venueField(deals, "instagram_handle")?.replace(/^@/, "") || null;
  const website = venueField(deals, "website_url");
  const directions = mapsHref({
    venue_name: venueName,
    google_maps_url: venueField(deals, "google_maps_url"),
    venue_address: venueField(deals, "venue_address"),
    venue_area: area,
  });

  const shared = sharedCheckedLine(deals);
  const url = `${SITE_URL}/deals/${slug}`;
  const shareText = `${offerLine(deals)} at ${venueInUbud(venueName)}`;
  const others = moreDeals(all, slug);
  const showsPrice = deals.some((d) => savingText(d) !== null);
  const howTo = howToUse(deals);

  const linkClass =
    "inline-flex min-h-11 items-center gap-1.5 font-medium text-brand-deep-green underline-offset-4 hover:underline dark:text-brand-gold";

  return (
    <div>
      {/* Counts views and taps for the venue's own number (deal_page_events); renders nothing. */}
      <DealPageTracker slug={slug} specialId={deals.length === 1 ? deals[0].id : undefined} />
      <section className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/deals">Deals</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{venueName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-brand-terracotta">
          {deals.length === 1 ? "Ubud deal" : `${deals.length} Ubud deals`}
        </p>
        <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-brand-deep-green dark:text-brand-gold sm:text-4xl">
          {venueName}
        </h1>
        {area ? (
          <p className="mt-2 inline-flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-4 w-4" aria-hidden />
            {area}
          </p>
        ) : null}
      </section>

      <section className="mx-auto mt-6 max-w-3xl space-y-4 px-4 sm:px-6">
        {deals.map((d) => {
          const saving = savingText(d);
          const when = [formatDays(d), formatHours(d.start_time, d.end_time)].filter(Boolean).join(" · ");
          return (
            <article key={d.id} className="rounded-xl border border-brand-gold/20 bg-card p-5 shadow-sm">
              <h2 className="font-serif text-xl font-semibold text-brand-deep-green dark:text-brand-gold">{dealTitle(d)}</h2>
              {saving ? (
                <p className="mt-2 inline-block rounded-full bg-brand-gold/15 px-3 py-1 text-sm font-semibold text-brand-deep-green dark:text-brand-gold">
                  {saving}
                </p>
              ) : null}
              {d.description ? <p className="mt-3 text-foreground">{d.description}</p> : null}
              <p className="mt-3 flex items-start gap-1.5 text-sm text-muted-foreground">
                <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {when}
              </p>
              {shared ? null : <p className="mt-2 text-xs text-muted-foreground">{checkedLine(d)}.</p>}
            </article>
          );
        })}
      </section>

      <section className="mx-auto max-w-3xl space-y-5 px-4 py-8 sm:px-6">
        {/* The deal's own words for claiming it, and only where the venue gave us the deal and says how:
            a deal read off its own page, or one with no mention of us, works by the venue's terms. */}
        {howTo.length > 0 ? (
          <div className="rounded-xl bg-brand-pale-green p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-deep-green dark:text-brand-gold">
              How to use it
            </p>
            {howTo.map(({ deal, line }) => (
              <p key={`${deal}:${line}`} className="mt-1 text-lg font-medium text-foreground">
                {deal ? <span className="font-semibold text-brand-deep-green dark:text-brand-gold">{deal}: </span> : null}
                {line}
              </p>
            ))}
          </div>
        ) : null}

        <ul className="flex flex-wrap gap-x-6 text-sm">
          <li>
            <a href={directions} target="_blank" rel="noopener noreferrer" className={linkClass} data-deal-track="map">
              <MapPin className="h-4 w-4" aria-hidden />
              Map and directions
            </a>
          </li>
          {handle ? (
            <li>
              <a
                href={`https://instagram.com/${encodeURIComponent(handle)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
                data-deal-track="instagram"
              >
                <Instagram className="h-4 w-4" aria-hidden />@{handle}
              </a>
            </li>
          ) : null}
          {website && isSafeUrl(website) ? (
            <li>
              <a href={website} target="_blank" rel="noopener noreferrer" className={linkClass} data-deal-track="website">
                <Globe className="h-4 w-4" aria-hidden />
                Website
              </a>
            </li>
          ) : null}
        </ul>

        {shared || showsPrice ? (
          <div className="space-y-1 text-sm text-muted-foreground">
            {shared ? <p>{shared}.</p> : null}
            {showsPrice ? <p>Prices in Bali often add tax and service on top.</p> : null}
          </div>
        ) : null}

        <div className="border-t border-brand-gold/20 pt-6">
          <p className="mb-3 text-sm font-medium text-foreground">Know someone who&apos;d like this?</p>
          <DealShare url={url} text={shareText} />
        </div>
      </section>

      {/* Literal hex: the brand tokens invert in dark mode, which would turn this band light sage. */}
      <section className="bg-[#2C4A3E] px-4 py-12">
        <div className="mx-auto max-w-md">
          <p className="text-center text-sm text-[#FAF5EC]/80">
            Get the week&apos;s best deals and what&apos;s on, by email every Wednesday. Free.
          </p>
          <NewsletterSignup variant="dark" source="deal_page" className="mt-3" />
          <p className="mt-4 text-center text-sm text-[#FAF5EC]/80">
            Want events picked for you too?{" "}
            <Link href="/quiz" className="font-medium text-brand-gold underline">
              Take the 90-second quiz
            </Link>
            .
          </p>
        </div>
      </section>

      {others.length > 0 ? (
        <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <h2 className="font-serif text-2xl font-semibold text-brand-deep-green dark:text-brand-gold">More deals in Ubud</h2>
          <div className="mt-6 space-y-4">
            {others.map((d) => (
              <SpecialCard key={d.id} special={d} />
            ))}
          </div>
          <Link href="/deals" className={`mt-6 text-sm ${linkClass}`}>
            See all Ubud deals
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </section>
      ) : null}
    </div>
  );
}
