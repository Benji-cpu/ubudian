import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL, CATEGORY_EMOJI } from "@/lib/constants";
import { MarkdownContent } from "@/components/blog/markdown-content";
import { ShareButtons } from "@/components/blog/share-buttons";
import { ExperienceCard } from "@/components/experiences/experience-card";
import { ExperienceJsonLd } from "@/components/experiences/experience-json-ld";
import { EventCard } from "@/components/events/event-card";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { Experience, Event } from "@/types";

interface ExperiencePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ExperiencePageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: experience } = await supabase
      .from("experiences")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (!experience) {
      return { title: "Experience Not Found | The Ubudian" };
    }

    const exp = experience as Experience;

    return {
      title: `${exp.title} | Ubud Experiences | The Ubudian`,
      description: exp.short_description || exp.description?.slice(0, 160),
      openGraph: {
        title: exp.title,
        description: exp.short_description || exp.description?.slice(0, 160),
        images: exp.cover_image_url ? [exp.cover_image_url] : undefined,
      },
    };
  } catch {
    return { title: "Experience Not Found | The Ubudian" };
  }
}

export default async function ExperiencePage({ params }: ExperiencePageProps) {
  let exp: Experience;
  let upcomingEvents: Event[] = [];
  let moreExperiences: Experience[] = [];

  try {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: experience } = await supabase
      .from("experiences")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (!experience) {
      notFound();
    }

    exp = experience as Experience;

    const today = new Date().toISOString().split("T")[0];

    const [eventsRes, othersRes] = await Promise.all([
      supabase
        .from("events")
        .select("*")
        .eq("status", "approved")
        .eq("category", exp.category)
        .gte("start_date", today)
        .order("start_date", { ascending: true })
        .limit(6),
      supabase
        .from("experiences")
        .select("*")
        .eq("is_active", true)
        .neq("id", exp.id)
        .order("sort_order", { ascending: true })
        .limit(3),
    ]);

    upcomingEvents = (eventsRes.data ?? []) as Event[];
    moreExperiences = (othersRes.data ?? []) as Experience[];
  } catch {
    notFound();
  }

  const experienceUrl = `${SITE_URL}/experiences/${exp.slug}`;
  const emoji = CATEGORY_EMOJI[exp.category] || "";

  return (
    <article>
      <ExperienceJsonLd experience={exp} />

      {/* Cover Image */}
      {exp.cover_image_url && (
        <div className="relative h-[400px] w-full sm:h-[480px]">
          <Image
            src={exp.cover_image_url}
            alt={exp.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
            <div className="mx-auto max-w-3xl">
              <h1 className="font-serif text-3xl font-bold tracking-tight text-white sm:text-5xl">
                {exp.title}
              </h1>
            </div>
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
              <BreadcrumbLink href="/experiences">Experiences</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{exp.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </nav>

      {/* Main Content */}
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            {emoji} {exp.category}
          </Badge>
          {exp.archetype_tags?.map((tag) => (
            <Badge key={tag} variant="secondary" className="capitalize">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Title (shown when no cover image) */}
        {!exp.cover_image_url && (
          <h1 className="mt-4 font-serif text-3xl font-bold tracking-tight text-brand-deep-green sm:text-4xl">
            {exp.title}
          </h1>
        )}

        {/* The Experience */}
        <section className="mt-8">
          <MarkdownContent content={exp.description} />
        </section>

        {/* Who It's For */}
        {exp.who_its_for && (
          <section className="mt-10">
            <h2 className="font-serif text-2xl font-bold text-brand-deep-green">Who It&apos;s For</h2>
            <div className="mt-4">
              <MarkdownContent content={exp.who_its_for} />
            </div>
          </section>
        )}

        {/* Practical Info */}
        {exp.practical_info && (
          <section className="mt-10">
            <h2 className="font-serif text-2xl font-bold text-brand-deep-green">Practical Info</h2>
            <div className="mt-4">
              <MarkdownContent content={exp.practical_info} />
            </div>
          </section>
        )}

        {/* Share */}
        <div className="mt-10 border-t pt-8">
          <ShareButtons title={exp.title} url={experienceUrl} />
        </div>
      </div>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <section className="border-t bg-brand-cream/50 px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-serif text-2xl font-bold text-brand-deep-green">
              Upcoming {exp.category} Events
            </h2>
            <p className="mt-2 text-muted-foreground">
              Coming up in Ubud — don&apos;t just read about it.
            </p>
            <div className="mt-6 space-y-3">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link
                href={`/events?category=${encodeURIComponent(exp.category)}`}
                className="text-sm font-semibold text-brand-deep-green underline underline-offset-4 hover:text-brand-gold"
              >
                Browse all {exp.category} events
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* More Experiences */}
      {moreExperiences.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="font-serif text-2xl font-bold text-brand-deep-green">
            More Experiences
          </h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {moreExperiences.map((other) => (
              <ExperienceCard key={other.id} experience={other} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
