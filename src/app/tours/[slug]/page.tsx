import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/constants";
import { MarkdownContent } from "@/components/blog/markdown-content";
import { ShareButtons } from "@/components/blog/share-buttons";
import { BookingCta } from "@/components/tours/booking-cta";
import { TourCard } from "@/components/tours/tour-card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users } from "lucide-react";
import { TourJsonLd } from "@/components/tours/tour-json-ld";
import { formatUsdPrice } from "@/lib/stripe/helpers";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getSiteSettings } from "@/lib/site-settings";
import type { Tour } from "@/types";

interface TourPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: TourPageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: tour } = await supabase
      .from("tours")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (!tour) {
      return { title: "Tour Not Found | The Ubudian" };
    }

    const t = tour as Tour;

    return {
      title: `${t.title} | Secret Tours | The Ubudian`,
      description: t.short_description || t.description?.slice(0, 160),
      openGraph: {
        title: t.title,
        description: t.short_description || t.description?.slice(0, 160),
        images: t.photo_urls?.[0] ? [t.photo_urls[0]] : undefined,
      },
    };
  } catch {
    return { title: "Tour Not Found | The Ubudian" };
  }
}

export default async function TourPage({ params }: TourPageProps) {
  const settings = await getSiteSettings();
  if (!settings.tours_enabled) notFound();

  let t: Tour;
  let others: Tour[] = [];

  try {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: tour } = await supabase
      .from("tours")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (!tour) {
      notFound();
    }

    t = tour as Tour;

    const { data: otherTours, error: othersError } = await supabase
      .from("tours")
      .select("*")
      .eq("is_active", true)
      .neq("id", t.id)
      .limit(3);

    if (othersError) console.error("Other tours query error:", othersError);
    others = (otherTours ?? []) as Tour[];
  } catch {
    notFound();
  }

  const tourUrl = `${SITE_URL}/tours/${t.slug}`;

  return (
    <article>
      <TourJsonLd tour={t} />
      {/* Photo Gallery */}
      {t.photo_urls?.length > 0 && (
        <div className="w-full">
          {t.photo_urls.length === 1 ? (
            <div className="relative h-[480px] w-full">
              <Image
                src={t.photo_urls[0]}
                alt={t.title}
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="grid gap-1 sm:grid-cols-2 md:grid-cols-3">
              {t.photo_urls.slice(0, 3).map((url, i) => (
                <div
                  key={url}
                  className={`relative w-full overflow-hidden ${i === 0 ? "aspect-[16/9] sm:col-span-2 sm:row-span-2 sm:h-[480px] sm:aspect-auto" : "hidden aspect-[16/9] sm:block sm:h-[238px] sm:aspect-auto"}`}
                >
                  <Image
                    src={url}
                    alt={`${t.title} photo ${i + 1}`}
                    fill
                    priority={i === 0}
                    sizes={i === 0 ? "(max-width: 640px) 100vw, 66vw" : "33vw"}
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Breadcrumbs */}
      <nav className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/tours">Tours</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          {/* Main content */}
          <div>
            <header>
              {t.theme && (
                <Badge variant="outline" className="mb-3">{t.theme}</Badge>
              )}
              <h1 className="font-serif text-3xl font-bold tracking-tight text-brand-deep-green sm:text-4xl">
                {t.title}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-muted-foreground">
                {t.duration && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {t.duration}
                  </span>
                )}
                {t.price_per_person && (
                  <span className="font-semibold text-brand-terracotta">
                    {formatUsdPrice(t.price_per_person)} / person
                  </span>
                )}
                {t.max_group_size && (
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    Max {t.max_group_size}
                  </span>
                )}
              </div>
            </header>

            {/* Description */}
            <section className="mt-8">
              <MarkdownContent content={t.description} />
            </section>

            {/* Itinerary */}
            {t.itinerary && (
              <section className="mt-10">
                <h2 className="font-serif text-2xl font-bold text-brand-deep-green">Itinerary</h2>
                <div className="mt-4">
                  <MarkdownContent content={t.itinerary} />
                </div>
              </section>
            )}

            {/* What's Included */}
            {t.whats_included && (
              <section className="mt-10">
                <h2 className="font-serif text-2xl font-bold text-brand-deep-green">What&apos;s Included</h2>
                <div className="mt-4">
                  <MarkdownContent content={t.whats_included} />
                </div>
              </section>
            )}

            {/* What to Bring */}
            {t.what_to_bring && (
              <section className="mt-10">
                <h2 className="font-serif text-2xl font-bold text-brand-deep-green">What to Bring</h2>
                <div className="mt-4">
                  <MarkdownContent content={t.what_to_bring} />
                </div>
              </section>
            )}

            {/* Additional photos */}
            {t.photo_urls?.length > 3 && (
              <section className="mt-10">
                <div className="grid gap-4 sm:grid-cols-2">
                  {t.photo_urls.slice(3).map((url, i) => (
                    <div key={url} className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
                      <Image
                        src={url}
                        alt={`${t.title} photo ${i + 4}`}
                        fill
                        sizes="(max-width: 640px) 100vw, 50vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Share */}
            <div className="mt-10 border-t pt-8">
              <ShareButtons title={t.title} url={tourUrl} />
            </div>
          </div>

          {/* Sidebar - Booking CTA */}
          <div className="lg:sticky lg:top-20">
            <BookingCta tour={t} />
          </div>
        </div>
      </div>

      {/* Other Tours */}
      {others.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="font-serif text-2xl font-bold text-brand-deep-green">
            More Tours
          </h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((other) => (
              <TourCard key={other.id} tour={other} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
