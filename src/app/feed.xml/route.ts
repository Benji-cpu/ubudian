import { createClient } from "@/lib/supabase/server";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/constants";
import { getSiteSettings } from "@/lib/site-settings";
import { nowInBali } from "@/lib/events/bali-time";
import type { BlogPost } from "@/types";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * The feed used to carry blog posts and newsletter editions only — both
 * flag-disabled in production, so it advertised links to pages that render
 * `notFound()` while omitting the site's actual content. It is linked from
 * every page via `<link rel="alternate">`, so an empty or 404-laden feed is a
 * sitewide signal that nothing is published here.
 *
 * It now leads with events, which is what this site actually produces daily,
 * and only includes the flagged sections when they are switched on.
 */
export async function GET() {
  const supabase = await createClient();
  const settings = await getSiteSettings();
  const today = nowInBali().dateStr;

  const [{ data: events }, { data: posts }, { data: newsletters }] = await Promise.all([
    supabase
      .from("events")
      .select("title, slug, short_description, description, start_date, created_at")
      .eq("status", "approved")
      .gte("start_date", today)
      .order("start_date", { ascending: true })
      .limit(40),
    settings.blog_enabled
      ? supabase
          .from("blog_posts")
          .select("title, slug, excerpt, published_at")
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] }),
    settings.newsletter_archive_enabled
      ? supabase
          .from("newsletter_editions")
          .select("subject, slug, preview_text, sent_at")
          .eq("status", "published")
          .order("sent_at", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] }),
  ]);

  type FeedItem = { title: string; link: string; description: string; pubDate: string };

  const items: FeedItem[] = [];

  type EventRow = {
    title: string;
    slug: string;
    short_description: string | null;
    description: string | null;
    start_date: string;
    created_at: string | null;
  };
  for (const event of (events ?? []) as EventRow[]) {
    items.push({
      title: event.title,
      link: `${SITE_URL}/events/${event.slug}`,
      description: event.short_description || (event.description ?? "").slice(0, 300),
      // Sort by when we published it, not when it happens — a feed reader wants
      // "what's new", and the items are already limited to upcoming events.
      pubDate: event.created_at ? new Date(event.created_at).toUTCString() : "",
    });
  }

  for (const post of (posts ?? []) as BlogPost[]) {
    items.push({
      title: post.title,
      link: `${SITE_URL}/blog/${post.slug}`,
      description: post.excerpt || "",
      pubDate: post.published_at ? new Date(post.published_at).toUTCString() : "",
    });
  }

  for (const edition of (newsletters ?? []) as { subject: string; slug: string; preview_text: string | null; sent_at: string | null }[]) {
    items.push({
      title: edition.subject,
      link: `${SITE_URL}/newsletter/${edition.slug}`,
      description: edition.preview_text || "",
      pubDate: edition.sent_at ? new Date(edition.sent_at).toUTCString() : "",
    });
  }

  // Sort combined by date descending
  items.sort((a, b) => {
    if (!a.pubDate) return 1;
    if (!b.pubDate) return -1;
    return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
  });

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${items
  .map(
    (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${item.link}</link>
      <description>${escapeXml(item.description)}</description>
      <guid isPermaLink="true">${item.link}</guid>
      ${item.pubDate ? `<pubDate>${item.pubDate}</pubDate>` : ""}
    </item>`
  )
  .join("\n")}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
