import { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/constants";
import { HUBS } from "@/lib/hubs";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminClient();

  const [
    blogRes,
    storiesRes,
    eventsRes,
    toursRes,
    newsletterRes,
    guidesRes,
    practitionersRes,
    placesRes,
    partnersRes,
  ] = await Promise.all([
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
    supabase
      .from("guides")
      .select("slug, updated_at")
      .eq("status", "published"),
    supabase
      .from("practitioners")
      .select("slug, updated_at")
      .eq("is_active", true),
    supabase
      .from("places")
      .select("slug, updated_at")
      .eq("is_published", true),
    supabase
      .from("partners")
      .select("slug, updated_at")
      .eq("is_active", true),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/events`, changeFrequency: "daily", priority: 0.9 },
    ...HUBS.map((h) => ({
      url: `${SITE_URL}/${h.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    { url: `${SITE_URL}/guides`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/stories`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/tours`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/blog`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/newsletter`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/practitioners`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/places`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/partners`, changeFrequency: "monthly", priority: 0.5 },
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

  const guidePages: MetadataRoute.Sitemap = (guidesRes.data ?? []).map((g) => ({
    url: `${SITE_URL}/guides/${g.slug}`,
    lastModified: g.updated_at,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const practitionerPages: MetadataRoute.Sitemap = (practitionersRes.data ?? []).map((p) => ({
    url: `${SITE_URL}/practitioners/${p.slug}`,
    lastModified: p.updated_at,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const placePages: MetadataRoute.Sitemap = (placesRes.data ?? []).map((p) => ({
    url: `${SITE_URL}/places/${p.slug}`,
    lastModified: p.updated_at,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const partnerPages: MetadataRoute.Sitemap = (partnersRes.data ?? []).map((p) => ({
    url: `${SITE_URL}/partners/${p.slug}`,
    lastModified: p.updated_at,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [
    ...staticPages,
    ...blogPages,
    ...storyPages,
    ...eventPages,
    ...tourPages,
    ...newsletterPages,
    ...guidePages,
    ...practitionerPages,
    ...placePages,
    ...partnerPages,
  ];
}
