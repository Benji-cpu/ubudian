import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/constants";
import { formatEventDate, formatEventTime } from "@/lib/utils";
import { CATEGORY_EMOJI } from "@/lib/constants";
import { MarkdownContent } from "@/components/blog/markdown-content";
import { ShareButtons } from "@/components/blog/share-buttons";
import { EventJsonLd } from "@/components/events/event-json-ld";
import { EventCard } from "@/components/events/event-card";
import { SaveEventButton } from "@/components/dashboard/save-event-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Calendar, ExternalLink, User } from "lucide-react";
import { isSafeUrl } from "@/lib/url-validation";
import { getCurrentProfile } from "@/lib/auth";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { Event, Story } from "@/types";

interface EventPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: event } = await supabase
      .from("events")
      .select("*")
      .eq("slug", slug)
      .eq("status", "approved")
      .single();

    if (!event) {
      return { title: "Event Not Found | The Ubudian" };
    }

    const e = event as Event;

    return {
      title: `${e.title} | Events in Ubud | The Ubudian`,
      description: e.short_description || e.description?.slice(0, 160),
      openGraph: {
        title: e.title,
        description: e.short_description || e.description?.slice(0, 160),
        images: e.cover_image_url ? [e.cover_image_url] : undefined,
        type: "article",
      },
    };
  } catch {
    return { title: "Event Not Found | The Ubudian" };
  }
}

export default async function EventPage({ params }: EventPageProps) {
  let e: Event;
  let related: Event[] = [];
  let facilitatorStory: Story | null = null;
  let currentProfileId: string | null = null;
  let initiallySaved = false;

  try {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: event } = await supabase
      .from("events")
      .select("*")
      .eq("slug", slug)
      .eq("status", "approved")
      .single();

    if (!event) {
      notFound();
    }

    e = event as Event;

    const profile = await getCurrentProfile();
    if (profile) {
      currentProfileId = profile.id;
      const { data: saved } = await supabase
        .from("saved_events")
        .select("event_id")
        .eq("profile_id", profile.id)
        .eq("event_id", e.id)
        .maybeSingle();
      initiallySaved = !!saved;
    }

    const { data: relatedEvents, error: relatedError } = await supabase
      .from("events")
      .select("*")
      .eq("status", "approved")
      .eq("category", e.category)
      .neq("id", e.id)
      .gte("start_date", new Date().toISOString().split("T")[0])
      .order("start_date", { ascending: true })
      .limit(4);

    if (relatedError) console.error("Related events query error:", relatedError);
    related = (relatedEvents ?? []) as Event[];

    // Query for a story linked to this event's organizer
    if (e.organizer_name) {
      const { data: storyData, error: storyError } = await supabase
        .from("stories")
        .select("*")
        .eq("status", "published")
        .ilike("related_organizer_name", e.organizer_name)
        .limit(1)
        .single();

      if (storyError && storyError.code !== "PGRST116") {
        console.error("Facilitator story query error:", storyError);
      }
      facilitatorStory = storyData ? (storyData as Story) : null;
    }
  } catch {
    notFound();
  }

  const eventUrl = `${SITE_URL}/events/${e.slug}`;

  return (
    <>
      <EventJsonLd event={e} />

      <article className="pb-24 md:pb-0">
        {/* Cover Image */}
        {e.cover_image_url && (
          <div className="mx-auto max-w-5xl px-0 sm:px-6 sm:pt-6">
            <div className="relative aspect-[16/9] w-full overflow-hidden sm:rounded-lg">
              <Image
                src={e.cover_image_url}
                alt={e.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="object-cover"
              />
            </div>
          </div>
        )}

        {/* Breadcrumbs */}
        <nav className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/events">Events</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{e.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </nav>

        {/* Header */}
        <header className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
          <Badge variant="outline" className="mb-3">
            {CATEGORY_EMOJI[e.category] || CATEGORY_EMOJI["Other"]} {e.category}
          </Badge>
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-serif text-3xl font-bold tracking-tight text-brand-deep-green sm:text-4xl lg:text-5xl">
              {e.title}
            </h1>
            {currentProfileId && (
              <div className="shrink-0 pt-1">
                <SaveEventButton
                  eventId={e.id}
                  profileId={currentProfileId}
                  initialSaved={initiallySaved}
                />
              </div>
            )}
          </div>

          {/* Event meta */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-2 text-foreground">
              <Calendar className="h-5 w-5 text-brand-gold" />
              <span className="font-medium">{formatEventDate(e.start_date, e.end_date)}</span>
            </div>

            {(e.start_time || e.end_time) && (
              <div className="flex items-center gap-2 text-foreground">
                <Clock className="h-5 w-5 text-brand-gold" />
                <span>{formatEventTime(e.start_time, e.end_time)}</span>
              </div>
            )}

            {e.venue_name && (
              <div className="text-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 shrink-0 text-brand-gold" />
                  <span>
                    {e.venue_name}
                    {e.venue_address && ` — ${e.venue_address}`}
                  </span>
                </div>
                {e.venue_map_url && isSafeUrl(e.venue_map_url) && (
                  <a
                    href={e.venue_map_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-7 mt-1 inline-block text-sm text-primary hover:underline"
                  >
                    View on Maps
                  </a>
                )}
              </div>
            )}

            {e.price_info && (
              <div className="text-lg font-semibold text-brand-terracotta">
                {e.price_info}
              </div>
            )}
          </div>

          {/* Ticket button (inline on desktop, hidden on mobile — replaced by sticky bar) */}
          {e.external_ticket_url && isSafeUrl(e.external_ticket_url) && (
            <Button asChild className="mt-6 hidden md:inline-flex" size="lg">
              <a href={e.external_ticket_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Get Tickets
              </a>
            </Button>
          )}
        </header>

        {/* Description */}
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <MarkdownContent content={e.description} />
        </div>

        {/* Organizer info */}
        {e.organizer_name && (
          <div className="mx-auto max-w-3xl border-t px-4 py-6 sm:px-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Organized by <strong className="text-foreground">{e.organizer_name}</strong></span>
              {e.organizer_instagram && (
                <a
                  href={`https://instagram.com/${e.organizer_instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {e.organizer_instagram}
                </a>
              )}
            </div>

            {/* Meet the Facilitator */}
            {facilitatorStory && (
              <Link
                href={`/stories/${facilitatorStory.slug}`}
                className="mt-4 flex items-center gap-4 rounded-lg bg-brand-cream p-4 transition-shadow hover:shadow-md"
              >
                {facilitatorStory.photo_urls?.[0] && (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full">
                    <Image
                      src={facilitatorStory.photo_urls[0]}
                      alt={facilitatorStory.subject_name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-brand-gold">
                    Meet the Facilitator
                  </p>
                  <p className="mt-0.5 font-serif text-sm font-medium text-brand-deep-green">
                    Read {facilitatorStory.title} &rarr;
                  </p>
                </div>
              </Link>
            )}
          </div>
        )}

        {/* Share Buttons */}
        <div className="mx-auto max-w-3xl border-t px-4 py-8 sm:px-6">
          <ShareButtons title={e.title} url={eventUrl} />
        </div>

        {/* Sticky mobile ticket CTA */}
        {e.external_ticket_url && isSafeUrl(e.external_ticket_url) && (
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-brand-gold/20 bg-white/95 px-4 py-3 backdrop-blur-sm md:hidden">
            <Button asChild className="w-full" size="lg">
              <a href={e.external_ticket_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Get Tickets
              </a>
            </Button>
          </div>
        )}

        {/* Related Events */}
        {related.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <h2 className="font-serif text-2xl font-bold text-brand-deep-green">
              More {e.category} Events
            </h2>
            <div className="mt-8 grid gap-3 md:grid-cols-2">
              {related.map((relatedEvent) => (
                <EventCard key={relatedEvent.id} event={relatedEvent} />
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
