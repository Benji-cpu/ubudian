import { createClient } from "@/lib/supabase/server";
import { queryWithRetry } from "@/lib/supabase/retry";
import type {
  ResolvedEntity,
  ShortcodeResolverDeps,
} from "@/lib/guides/shortcodes";

async function resolveEvent(slug: string): Promise<ResolvedEntity | null> {
  try {
    const supabase = await createClient();
    const { data } = await queryWithRetry(
      () =>
        supabase
          .from("events")
          .select("slug, title, short_description, cover_image_url, status")
          .eq("slug", slug)
          .eq("status", "approved")
          .limit(1)
          .maybeSingle(),
      "guides-resolver-event",
    );
    if (!data) return null;
    return {
      kind: "event",
      slug: data.slug as string,
      title: data.title as string,
      subtitle: (data.short_description as string | null) ?? null,
      href: `/events/${data.slug}`,
      imageUrl: (data.cover_image_url as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

async function resolveStory(slug: string): Promise<ResolvedEntity | null> {
  try {
    const supabase = await createClient();
    const { data } = await queryWithRetry(
      () =>
        supabase
          .from("stories")
          .select("slug, title, subject_tagline, photo_urls, status")
          .eq("slug", slug)
          .eq("status", "published")
          .limit(1)
          .maybeSingle(),
      "guides-resolver-story",
    );
    if (!data) return null;
    const photos = (data.photo_urls as string[] | null) ?? [];
    return {
      kind: "story",
      slug: data.slug as string,
      title: data.title as string,
      subtitle: (data.subject_tagline as string | null) ?? null,
      href: `/stories/${data.slug}`,
      imageUrl: photos[0] ?? null,
    };
  } catch {
    return null;
  }
}

async function resolveRetreat(slug: string): Promise<ResolvedEntity | null> {
  try {
    const supabase = await createClient();
    const { data } = await queryWithRetry(
      () =>
        supabase
          .from("journeys")
          .select("slug, title, subtitle, cover_image_url, is_published")
          .eq("slug", slug)
          .eq("is_published", true)
          .limit(1)
          .maybeSingle(),
      "guides-resolver-retreat",
    );
    if (!data) return null;
    return {
      kind: "retreat",
      slug: data.slug as string,
      title: data.title as string,
      subtitle: (data.subtitle as string | null) ?? null,
      href: `/experiences/${data.slug}`,
      imageUrl: (data.cover_image_url as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

async function resolvePractitioner(
  slug: string,
): Promise<ResolvedEntity | null> {
  try {
    const supabase = await createClient();
    const { data } = await queryWithRetry(
      () =>
        supabase
          .from("practitioners")
          .select(
            "slug, name, short_description, bio, hero_image_url, photo_url, is_active",
          )
          .eq("slug", slug)
          .eq("is_active", true)
          .limit(1)
          .maybeSingle(),
      "guides-resolver-practitioner",
    );
    if (!data) return null;
    const subtitle =
      (data.short_description as string | null) ??
      (data.bio as string | null)?.split("\n")[0]?.slice(0, 140) ??
      null;
    return {
      kind: "practitioner",
      slug: data.slug as string,
      title: data.name as string,
      subtitle,
      href: `/practitioners/${data.slug}`,
      imageUrl:
        (data.hero_image_url as string | null) ??
        (data.photo_url as string | null) ??
        null,
    };
  } catch {
    return null;
  }
}

async function resolvePlace(slug: string): Promise<ResolvedEntity | null> {
  try {
    const supabase = await createClient();
    const { data } = await queryWithRetry(
      () =>
        supabase
          .from("places")
          .select(
            "slug, name, short_description, description, hero_image_url, photo_urls, neighbourhood, is_published",
          )
          .eq("slug", slug)
          .eq("is_published", true)
          .limit(1)
          .maybeSingle(),
      "guides-resolver-place",
    );
    if (!data) return null;
    const photos = (data.photo_urls as string[] | null) ?? [];
    return {
      kind: "place",
      slug: data.slug as string,
      title: data.name as string,
      subtitle:
        (data.short_description as string | null) ??
        (data.neighbourhood as string | null) ??
        null,
      href: `/places/${data.slug}`,
      imageUrl:
        (data.hero_image_url as string | null) ?? photos[0] ?? null,
    };
  } catch {
    return null;
  }
}

async function resolvePartner(slug: string): Promise<ResolvedEntity | null> {
  try {
    const supabase = await createClient();
    const { data } = await queryWithRetry(
      () =>
        supabase
          .from("partners")
          .select(
            "slug, name, short_description, description, hero_image_url, base_location, is_active",
          )
          .eq("slug", slug)
          .eq("is_active", true)
          .limit(1)
          .maybeSingle(),
      "guides-resolver-partner",
    );
    if (!data) return null;
    return {
      kind: "partner",
      slug: data.slug as string,
      title: data.name as string,
      subtitle:
        (data.short_description as string | null) ??
        (data.base_location as string | null) ??
        null,
      href: `/partners/${data.slug}`,
      imageUrl: (data.hero_image_url as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Default resolver deps for guide shortcodes. All six kinds (event, story,
 * retreat, practitioner, place, partner) resolve against their respective
 * tables. Rows that don't exist or aren't published/active fall back to
 * styled inline text in the renderer.
 */
export const defaultGuideResolvers: ShortcodeResolverDeps = {
  resolveEvent,
  resolveStory,
  resolveRetreat,
  resolvePractitioner,
  resolvePlace,
  resolvePartner,
};
