import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/constants";
import { MarkdownContent } from "@/components/blog/markdown-content";
import { ShareButtons } from "@/components/blog/share-buttons";
import { EventJsonLd } from "@/components/events/event-json-ld";
import { EventCard } from "@/components/events/event-card";
import { EventHero } from "@/components/events/event-hero";
import { EventMap } from "@/components/events/event-map";
import { FacilitatorCard } from "@/components/events/facilitator-card";
import { SaveEventButton } from "@/components/dashboard/save-event-button";
import { Button } from "@/components/ui/button";
import { MapPin, ExternalLink, User } from "lucide-react";
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
import type { Event } from "@/types";

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
  } catch {
    notFound();
  }

  const eventUrl = `${SITE_URL}/events/${e.slug}`;

  const saveButton = currentProfileId ? (
    <SaveEventButton
      eventId={e.id}
      profileId={currentProfileId}
      initialSaved={initiallySaved}
    />
  ) : null;

  return (
    <>
      <EventJsonLd event={e} />

      <article className="pb-24 md:pb-0">
        {/* Editorial hero */}
        <EventHero event={e} saveButton={saveButton} />

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

        {/* Inline ticket CTA (desktop) */}
        {e.external_ticket_url && isSafeUrl(e.external_ticket_url) && (
          <div className="mx-auto mt-4 hidden max-w-3xl px-4 sm:px-6 md:block">
            <Button asChild size="lg">
              <a href={e.external_ticket_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Get Tickets
              </a>
            </Button>
          </div>
        )}

        {/* Description */}
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <MarkdownContent content={e.description} />
        </div>

        {/* Facilitator card (renders nothing if no linked story) */}
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <FacilitatorCard organizerName={e.organizer_name} />
        </div>

        {/* Location section (map + venue details) */}
        <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <h2 className="font-serif text-2xl font-semibold text-brand-deep-green">
            Location
          </h2>

          {e.venue_name && (
            <div className="mt-3 text-foreground">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-gold" />
                <div>
                  <p className="font-medium">{e.venue_name}</p>
                  {e.venue_address && (
                    <p className="text-sm text-muted-foreground">{e.venue_address}</p>
                  )}
                  {e.venue_map_url && isSafeUrl(e.venue_map_url) && (
                    <a
                      href={e.venue_map_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-sm text-primary hover:underline"
                    >
                      View on Google Maps
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-5">
            <EventMap event={e} />
          </div>
        </section>

        {/* Organizer info */}
        {e.organizer_name && (
          <div className="mx-auto max-w-3xl border-t px-4 py-6 sm:px-6">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>
                Organized by{" "}
                <strong className="text-foreground">{e.organizer_name}</strong>
              </span>
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
