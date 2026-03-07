import { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/constants";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminClient();

  const [blogRes, storiesRes, eventsRes, toursRes, newsletterRes] =
    await Promise.all([
      supabase
        .from("blog_posts")
        .select("slug, updated_at")
        .eq("status", "published"),
      supabase
        .from("stories")
        .select("slug, updated_at")
        .eq("status", "published"),
      supabase
        .from("events")
        .select("slug, updated_at")
        .eq("status", "approved"),
      supabase
        .from("tours")
        .select("slug, updated_at")
        .eq("is_active", true),
      supabase
        .from("newsletter_editions")
        .select("slug, updated_at")
        .eq("status", "published"),
    ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/events`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/stories`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/tours`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/blog`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/newsletter`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/events/submit`, changeFrequency: "monthly", priority: 0.4 },
  ];

  const blogPages: MetadataRoute.Sitemap = (blogRes.data ?? []).map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: p.updated_at,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const storyPages: MetadataRoute.Sitemap = (storiesRes.data ?? []).map((s) => ({
    url: `${SITE_URL}/stories/${s.slug}`,
    lastModified: s.updated_at,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const eventPages: MetadataRoute.Sitemap = (eventsRes.data ?? []).map((e) => ({
    url: `${SITE_URL}/events/${e.slug}`,
    lastModified: e.updated_at,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const tourPages: MetadataRoute.Sitemap = (toursRes.data ?? []).map((t) => ({
    url: `${SITE_URL}/tours/${t.slug}`,
    lastModified: t.updated_at,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const newsletterPages: MetadataRoute.Sitemap = (newsletterRes.data ?? []).map(
    (n) => ({
      url: `${SITE_URL}/newsletter/${n.slug}`,
      lastModified: n.updated_at,
      changeFrequency: "monthly",
      priority: 0.5,
    })
  );

  return [
    ...staticPages,
    ...blogPages,
    ...storyPages,
    ...eventPages,
    ...tourPages,
    ...newsletterPages,
  ];
}
