import { createClient } from "@/lib/supabase/server";
import Image from "next/image";

interface JourneyGuidesProps {
  practitionerIds: string[];
}

interface PractitionerRow {
  id: string;
  slug: string;
  name: string;
  modalities: string[] | null;
  bio: string | null;
  photo_url: string | null;
  base_location: string | null;
  contact_instagram: string | null;
}

/**
 * "Guides on this retreat" rail — one card per practitioner referenced by any
 * atom in the journey. Falls back to a gold-on-deep-green initials tile when
 * `photo_url` is null. We never fabricate faces.
 */
export async function JourneyGuides({ practitionerIds }: JourneyGuidesProps) {
  if (practitionerIds.length === 0) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("practitioners")
    .select("id, slug, name, modalities, bio, photo_url, base_location, contact_instagram")
    .in("id", practitionerIds)
    .eq("is_active", true);

  const guides = (data ?? []) as PractitionerRow[];
  if (guides.length === 0) return null;

  return (
    <section className="border-t bg-white px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <span className="text-xs uppercase tracking-[0.2em] text-brand-gold">
            People you&apos;ll meet
          </span>
          <h2 className="mt-2 font-serif text-2xl font-medium text-brand-deep-green">
            Guides on this retreat
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Practitioners who hold pieces of these days — known by name, found on the ground.
          </p>
        </div>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((g) => (
            <li
              key={g.id}
              className="flex items-start gap-4 rounded-md border border-brand-gold/15 bg-brand-cream/30 p-4"
            >
              <Portrait name={g.name} url={g.photo_url} />
              <div className="min-w-0 flex-1">
                <p className="font-serif text-base font-medium text-brand-deep-green">
                  {g.name}
                </p>
                {g.modalities && g.modalities.length > 0 && (
                  <p className="mt-0.5 text-xs uppercase tracking-wider text-brand-gold">
                    {g.modalities.slice(0, 3).join(" · ")}
                  </p>
                )}
                {g.bio && (
                  <p className="mt-2 line-clamp-3 text-sm text-foreground/85">{g.bio}</p>
                )}
                {g.contact_instagram && (
                  <a
                    href={`https://instagram.com/${g.contact_instagram.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs text-brand-gold hover:text-brand-deep-green"
                  >
                    @{g.contact_instagram.replace(/^@/, "")} &rarr;
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Portrait({ name, url }: { name: string; url: string | null }) {
  if (url) {
    return (
      <Image
        src={url}
        alt={name}
        width={72}
        height={72}
        className="h-[72px] w-[72px] shrink-0 rounded-full border border-brand-gold/30 object-cover"
      />
    );
  }
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-brand-deep-green font-serif text-xl font-medium text-brand-gold"
      aria-hidden
    >
      {initials}
    </span>
  );
}
