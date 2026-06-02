import { ARCHETYPES } from "@/lib/quiz-data";
import type { ArchetypeId, Event, Experience } from "@/types";

/**
 * Branded HTML for the post-quiz "custom spread" email — the safety net so a
 * taker doesn't lose their curated set once they start browsing the general
 * feed. Raw-string template with inline styles (email clients ignore <style>);
 * register stays lush + restrained per brand, no emoji-soup.
 */

const GREEN = "#2C4A3E";
const GOLD = "#C9A84C";
const CREAM = "#FAF5EC";
const CHARCOAL = "#2D2D2D";

function fmtDate(ymd: string | null): string {
  if (!ymd) return "";
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return "";
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function buildSpreadEmailHtml(opts: {
  primary: ArchetypeId;
  events: Event[];
  experiences: Experience[];
  siteUrl: string;
}): string {
  const { primary, events, experiences, siteUrl } = opts;
  const base = siteUrl.replace(/\/$/, "");
  const a = ARCHETYPES[primary];

  const eventRows = events
    .map((e) => {
      const when = fmtDate(e.start_date);
      const meta = [when, e.venue_name]
        .filter((v): v is string => !!v)
        .map(esc)
        .join(" · ");
      return `
        <tr><td style="padding:0 0 16px;">
          <a href="${base}/events/${e.slug}" style="color:${GREEN};text-decoration:none;font-weight:600;font-size:16px;">${esc(e.title)}</a>
          ${meta ? `<div style="color:#6b6b6b;font-size:13px;margin-top:2px;">${meta}</div>` : ""}
        </td></tr>`;
    })
    .join("");

  const expRows = experiences
    .map(
      (x) => `
        <tr><td style="padding:0 0 16px;">
          <a href="${base}/experiences/${x.slug}" style="color:${GREEN};text-decoration:none;font-weight:600;font-size:16px;">${esc(x.title)}</a>
          ${x.short_description ? `<div style="color:#6b6b6b;font-size:13px;margin-top:2px;">${esc(x.short_description)}</div>` : ""}
        </td></tr>`
    )
    .join("");

  const expSection = experiences.length
    ? `
      <tr><td style="padding:28px 0 10px;">
        <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${GOLD};">Curated journeys</div>
        <div style="font-family:Georgia,serif;font-size:20px;color:${GREEN};margin-top:4px;">Multi-day threads for you</div>
      </td></tr>
      <tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${expRows}</table></td></tr>`
    : "";

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:${CREAM};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #ece3cf;">

        <tr><td style="background:${GREEN};padding:28px 32px;">
          <div style="color:${GOLD};font-size:12px;letter-spacing:3px;text-transform:uppercase;">The Ubudian</div>
          <div style="color:#ffffff;font-family:Georgia,serif;font-size:13px;margin-top:14px;letter-spacing:1px;">YOUR UBUD SPIRIT</div>
          <div style="color:#ffffff;font-family:Georgia,serif;font-size:30px;margin-top:2px;">${esc(a.name)}</div>
          <div style="color:rgba(255,255,255,0.85);font-family:Georgia,serif;font-style:italic;font-size:16px;margin-top:8px;">${esc(a.tagline)}</div>
        </td></tr>

        <tr><td style="padding:28px 32px 4px;color:${CHARCOAL};font-size:15px;line-height:1.6;">
          Here's a spread we pulled together for you — the gatherings and journeys most likely to feel like yours. Save it to your profile and we'll keep tuning the feed as you go.
        </td></tr>

        <tr><td style="padding:24px 32px 0;">
          <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${GOLD};">Events for you</div>
          <div style="font-family:Georgia,serif;font-size:20px;color:${GREEN};margin-top:4px;">Worth clearing an evening for</div>
        </td></tr>
        <tr><td style="padding:14px 32px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${eventRows || `<tr><td style="color:#6b6b6b;font-size:14px;padding-bottom:12px;">Fresh events land daily — your feed will fill in fast.</td></tr>`}</table></td></tr>

        <tr><td style="padding:0 32px;">${expSection}</td></tr>

        <tr><td align="center" style="padding:28px 32px 32px;">
          <a href="${base}/login?redirect=/dashboard" style="display:inline-block;background:${GOLD};color:${GREEN};text-decoration:none;font-weight:700;padding:13px 28px;border-radius:999px;font-size:15px;">Save my spread &amp; see my full feed</a>
        </td></tr>

        <tr><td style="background:${CREAM};padding:18px 32px;color:#8a8a7a;font-size:12px;line-height:1.5;">
          You're getting this because you took the quiz at <a href="${base}" style="color:${GREEN};">theubudian.life</a>. The valley, one email at a time.
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}
