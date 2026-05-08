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

/**
 * Default resolver deps for guide shortcodes. Practitioner / place / partner
 * resolvers are intentionally null until those tables exist (Phase 2);
 * shortcodes for those kinds will fall back to styled inline text.
 */
export const defaultGuideResolvers: ShortcodeResolverDeps = {
  resolveEvent,
  resolveStory,
  resolveRetreat,
};
