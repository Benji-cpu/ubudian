import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/auth";
import { createPost } from "@/lib/beehiiv";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
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

    if (edition.sponsor_name) {
      sections.push(
        `<h3>Sponsored by ${escapeHtml(edition.sponsor_name as string)}</h3>${escapeHtml((edition.sponsor_text as string) || "")}${
          edition.sponsor_url ? `<p><a href="${escapeHtml(edition.sponsor_url as string)}">Learn more</a></p>` : ""
        }`
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
