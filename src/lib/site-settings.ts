import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type SiteSettings = {
  blog_enabled: boolean;
  stories_enabled: boolean;
  tours_enabled: boolean;
  newsletter_archive_enabled: boolean;
};

export const SITE_SETTINGS_FALLBACK: SiteSettings = {
  blog_enabled: false,
  stories_enabled: false,
  tours_enabled: false,
  newsletter_archive_enabled: false,
};

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("blog_enabled, stories_enabled, tours_enabled, newsletter_archive_enabled")
    .eq("id", 1)
    .maybeSingle();

  return (data as SiteSettings | null) ?? SITE_SETTINGS_FALLBACK;
});
