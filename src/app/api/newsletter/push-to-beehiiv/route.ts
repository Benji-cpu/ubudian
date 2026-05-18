import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/auth";
import { createPost } from "@/lib/beehiiv";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { SITE_URL } from "@/lib/constants";
import { NextResponse } from "next/server";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request: Request) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(request);
  const { success } = rateLimit(`push-beehiiv:${ip}`, { limit: 5, windowSeconds: 900 });
  if (!success) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const { editionId } = await request.json();

    if (!editionId) {
      return NextResponse.json({ error: "Edition ID required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: edition, error: fetchError } = await supabase
      .from("newsletter_editions")
      .select("*")
      .eq("id", editionId)
      .single();

    if (fetchError || !edition) {
      return NextResponse.json({ error: "Edition not found" }, { status: 404 });
    }

    // Build simple HTML from content_json
    const content = (edition.content_json ?? {}) as Record<string, string>;
    const sections: string[] = [];

    // Partner credit (top of email) — preferred path uses sponsorships table.
    const nowIso = new Date().toISOString();
    const { data: sponsorshipRow } = await supabase
      .from("sponsorships")
      .select("sponsor:sponsors!inner(name, website_url, tagline, status)")
      .eq("entity_type", "newsletter_edition")
      .eq("entity_id", editionId)
      .lte("starts_at", nowIso)
      .or(`ends_at.is.null,ends_at.gt.${nowIso}`)
      .eq("sponsor.status", "active")
      .order("starts_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const partner = (sponsorshipRow as { sponsor?: { name: string; website_url: string | null; tagline: string | null } } | null)?.sponsor;
    if (partner) {
      const linkOpen = partner.website_url
        ? `<a href="${escapeHtml(partner.website_url)}">`
        : "";
      const linkClose = partner.website_url ? "</a>" : "";
      sections.push(
        `<p><em>This edition held by ${linkOpen}${escapeHtml(partner.name)}${linkClose}.${
          partner.tagline ? ` ${escapeHtml(partner.tagline)}` : ""
        }</em></p>`
      );
    }

    if (content.featured_story_excerpt) {
      sections.push(`<h2>Featured Story</h2>${escapeHtml(content.featured_story_excerpt)}`);
    }
    if (content.weekly_flow) {
      sections.push(`<h2>What's Happening This Week</h2>${escapeHtml(content.weekly_flow)}`);
    }
    if (content.community_bulletin) {
      sections.push(`<h2>Community Bulletin</h2>${escapeHtml(content.community_bulletin)}`);
    }
    if (content.cultural_moment) {
      sections.push(`<h2>Cultural Moment</h2>${escapeHtml(content.cultural_moment)}`);
    }
    if (content.weekly_question) {
      sections.push(`<h2>Weekly Question: ${escapeHtml(content.weekly_question)}</h2>${escapeHtml(content.weekly_question_responses || "")}`);
    }
    if (content.tour_spotlight_text) {
      sections.push(`<h2>Tour Spotlight</h2>${escapeHtml(content.tour_spotlight_text)}`);
    }

    // Legacy sponsor fallback (bottom of email) — used only when no community
    // partner is attached via the sponsorships table.
    if (!partner && edition.sponsor_name) {
      sections.push(
        `<h3>Sponsored by ${escapeHtml(edition.sponsor_name as string)}</h3>${escapeHtml((edition.sponsor_text as string) || "")}${
          edition.sponsor_url ? `<p><a href="${escapeHtml(edition.sponsor_url as string)}">Learn more</a></p>` : ""
        }`
      );
    }

    // Community Partners footer — soft list of all Patron+ active sponsors,
    // links to each partner profile. Editorial, never "Sponsored by".
    const { data: footerSponsors } = await supabase
      .from("sponsors")
      .select("name, slug, tier")
      .eq("status", "active")
      .order("name", { ascending: true });

    const partners = ((footerSponsors ?? []) as { name: string; slug: string; tier: string }[])
      .filter((s) => s.tier === "partner" || s.tier === "anchor" || s.tier === "patron");

    if (partners.length > 0) {
      const links = partners
        .map(
          (s) =>
            `<a href="${escapeHtml(SITE_URL)}/community/partners/${escapeHtml(s.slug)}">${escapeHtml(s.name)}</a>`
        )
        .join(" · ");
      sections.push(
        `<p><em>The Ubudian is sustained by these community partners: ${links}.</em></p>`
      );
    }

    const htmlContent = sections.join("<hr>");

    const beehiivPostId = await createPost(edition.subject, htmlContent);

    // Update edition
    await supabase
      .from("newsletter_editions")
      .update({
        beehiiv_post_id: beehiivPostId,
        html_content: htmlContent,
        status: "published",
        sent_at: new Date().toISOString(),
      })
      .eq("id", editionId);

    return NextResponse.json({ success: true, beehiivPostId });
  } catch {
    return NextResponse.json({ error: "Failed to push to Beehiiv" }, { status: 500 });
  }
}
