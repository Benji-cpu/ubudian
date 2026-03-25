import { createClient } from "@/lib/supabase/server";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/constants";
import type { BlogPost } from "@/types";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const supabase = await createClient();

  const [{ data: posts }, { data: newsletters }] = await Promise.all([
    supabase
      .from("blog_posts")
      .select("title, slug, excerpt, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(20),
    supabase
      .from("newsletter_editions")
      .select("subject, slug, preview_text, sent_at")
      .eq("status", "published")
      .order("sent_at", { ascending: false })
      .limit(20),
  ]);

  type FeedItem = { title: string; link: string; description: string; pubDate: string };

  const items: FeedItem[] = [];

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
