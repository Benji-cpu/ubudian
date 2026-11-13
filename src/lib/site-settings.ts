import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { cachedRead, CACHE_TAGS } from "@/lib/cached-read";

export type SiteSettings = {
  blog_enabled: boolean;
  stories_enabled: boolean;
  tours_enabled: boolean;
  newsletter_archive_enabled: boolean;
  guides_enabled: boolean;
};

export const SITE_SETTINGS_FALLBACK: SiteSettings = {
  blog_enabled: false,
  stories_enabled: false,
  tours_enabled: false,
  newsletter_archive_enabled: false,
  guides_enabled: false,
};

/**
 * The feature switches, read on every page by the header and footer. Cached
 * for an hour; the admin settings route clears the cache when a switch moves.
 * Read with the admin client (five booleans, no cookies), so the read can be
 * shared between visitors.
 */
const readSiteSettings = cachedRead(
  async (): Promise<SiteSettings> => {
    const { data, error } = await createAdminClient()
      .from("site_settings")
      .select("blog_enabled, stories_enabled, tours_enabled, newsletter_archive_enabled, guides_enabled")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as SiteSettings | null) ?? SITE_SETTINGS_FALLBACK;
  },
  "site-settings-v1",
  { seconds: 3600, tag: CACHE_TAGS.siteSettings }
);

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    return await readSiteSettings();
  } catch {
    return SITE_SETTINGS_FALLBACK;
  }
});
