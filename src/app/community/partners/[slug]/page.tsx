import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Instagram, Mail, MessageCircle } from "lucide-react";
import { getSponsorBySlug } from "@/lib/sponsors/sponsor-service";
import { recordSponsorshipEvent } from "@/lib/sponsors/analytics";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const sponsor = await getSponsorBySlug(slug);
  if (!sponsor) return { title: "Partner Not Found | The Ubudian" };
  return {
    title: `${sponsor.name} | Community Partners | The Ubudian`,
    description: sponsor.tagline ?? sponsor.description?.slice(0, 160) ?? undefined,
    openGraph: {
      title: sponsor.name,
      description: sponsor.tagline ?? sponsor.description?.slice(0, 160) ?? undefined,
      images: sponsor.hero_image_url
        ? [sponsor.hero_image_url]
        : sponsor.logo_url
          ? [sponsor.logo_url]
          : undefined,
    },
  };
}

export default async function CommunityPartnerPage({ params }: PageProps) {
  const { slug } = await params;
  const sponsor = await getSponsorBySlug(slug);
  if (!sponsor) notFound();
  await recordSponsorshipEvent({ sponsorId: sponsor.id, eventType: "profile_view" });

  const instagramUrl = sponsor.instagram_handle
    ? `https://instagram.com/${sponsor.instagram_handle.replace("@", "")}`
    : null;
  const whatsappUrl = sponsor.contact_whatsapp
    ? `https://wa.me/${sponsor.contact_whatsapp.replace(/[^\d]/g, "")}`
    : null;

  return (
    <article className="pb-24">
      <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/community/partners">Community Partners</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{sponsor.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {sponsor.hero_image_url && (
        <div className="relative mx-auto mt-8 aspect-[16/9] max-w-5xl overflow-hidden bg-brand-cream sm:rounded-md">
          <Image
            src={sponsor.hero_image_url}
            alt={sponsor.name}
            fill
            className="object-cover"
            unoptimized
            priority
            sizes="(min-width: 1024px) 1024px, 100vw"
          />
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4 pt-12 sm:px-6">
        {sponsor.category_sponsor && (
          <p className="font-serif text-sm uppercase tracking-[0.25em] text-brand-gold">
            Anchor partner · {sponsor.category_sponsor}
          </p>
        )}
        <h1 className="mt-3 font-serif text-4xl font-bold text-brand-deep-green md:text-5xl">
          {sponsor.name}
        </h1>
        {sponsor.tagline && (
          <p className="mt-4 font-serif text-xl italic leading-relaxed text-muted-foreground">
            {sponsor.tagline}
          </p>
        )}

        {sponsor.description && (
          <div className="mt-10 space-y-5 text-lg leading-relaxed text-foreground/90">
            {sponsor.description.split(/\n{2,}/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}

        <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-brand-gold/30 pt-8 text-sm">
          {sponsor.website_url && (
            <a
              href={sponsor.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-brand-deep-green underline decoration-brand-gold/40 underline-offset-4 hover:decoration-brand-gold"
            >
              <ExternalLink className="h-4 w-4" />
              Website
            </a>
          )}
          {instagramUrl && (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-brand-deep-green hover:underline"
            >
              <Instagram className="h-4 w-4" />
              {sponsor.instagram_handle}
            </a>
          )}
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-brand-deep-green hover:underline"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          )}
          {sponsor.contact_email && (
            <a
              href={`mailto:${sponsor.contact_email}`}
              className="inline-flex items-center gap-1.5 text-brand-deep-green hover:underline"
            >
              <Mail className="h-4 w-4" />
              {sponsor.contact_email}
            </a>
          )}
        </div>

        <p className="mt-16 text-sm leading-relaxed text-muted-foreground">
          {sponsor.name} is a{" "}
          <Link
            href="/community/partners"
            className="underline decoration-brand-gold/40 underline-offset-4 hover:decoration-brand-gold"
          >
            community partner
          </Link>{" "}
          of The Ubudian — one of the studios, ceremony spaces, healers, restaurants and villas who
          help sustain this platform.
        </p>
      </div>
    </article>
  );
}
