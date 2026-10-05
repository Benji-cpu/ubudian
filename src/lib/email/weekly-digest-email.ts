import { GREEN, GOLD, CREAM, CHARCOAL, esc, fmtEmailDate, emailFooter } from "@/lib/email/brand";
import { ARCHETYPES } from "@/lib/quiz-data";
import { formatEventTime } from "@/lib/utils";
import { buildDealsBlockHtml, buildPreheader } from "@/lib/email/weekly-deals";
import type { ArchetypeId, Event, Special } from "@/types";

/** One plain line on what an event is, so a title like "Contact Class with Sima" isn't a mystery. */
export function eventBlurb(e: Pick<Event, "short_description" | "description">): string {
  const text = (e.short_description || e.description || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  const firstSentence = text.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? text;
  const line = firstSentence.length <= 140 ? firstSentence : `${text.slice(0, 139).trimEnd()}…`;
  return line;
}

/**
 * "This week in Ubud" — the weekly email. Personalised via the
 * reader's archetype when they have one; otherwise it leads with the week itself.
 * With `deals`, the issue opens on this week's deals and the events follow
 * under "What's on".
 */
export function buildWeeklyDigestEmailHtml(opts: {
  archetype: ArchetypeId | null;
  events: Event[];
  siteUrl: string;
  unsubUrl: string;
  weekLabel: string;
  deals?: Special[];
}): string {
  const { archetype, events, siteUrl, unsubUrl, weekLabel, deals = [] } = opts;
  const withDeals = deals.length > 0;
  const a = archetype ? ARCHETYPES[archetype] : null;

  const intro = withDeals
    ? a
      ? `This week's deals, then what's on — picked for ${esc(a.name)}.`
      : `This week's deals, then what's on in the valley.`
    : a
      ? `Picked for ${esc(a.name)} — what's moving in the valley this week.`
      : `What's moving in the valley this week.`;
  const eventsHeading =
    withDeals && events.length > 0
      ? `
  <tr><td style="padding:22px 32px 4px;">
    <p style="margin:0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${GOLD};font-family:Georgia,serif;">What's on</p>
  </td></tr>`
      : "";

  const rows = events
    .map((e) => {
      const when = [fmtEmailDate(e.start_date), formatEventTime(e.start_time, e.end_time)]
        .filter(Boolean)
        .join(" · ");
      const where = e.venue_name ? ` · ${esc(e.venue_name)}` : "";
      const blurb = eventBlurb(e);
      const blurbHtml = blurb
        ? `
    <p style="margin:6px 0 0;font-size:13px;line-height:1.5;color:${CHARCOAL};font-family:Georgia,serif;">${esc(blurb)}</p>`
        : "";
      return `
  <tr><td style="padding:14px 32px;border-top:1px solid ${GOLD}22;">
    <a href="${siteUrl}/events/${e.slug}" style="text-decoration:none;">
      <p style="margin:0;font-size:17px;color:${GREEN};font-family:Georgia,serif;font-weight:500;">${esc(e.title)}</p>
    </a>
    <p style="margin:4px 0 0;font-size:13px;color:${CHARCOAL}aa;font-family:Georgia,serif;">${esc(when)}${where}</p>${blurbHtml}
  </td></tr>`;
    })
    .join("");

  const preheader = withDeals ? buildPreheader(deals, events.length) : "";
  const preheaderHtml = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(preheader)}</div>`
    : "";

  return `<!doctype html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>This week in Ubud</title>
</head><body style="margin:0;padding:0;background:${CREAM};">
${preheaderHtml}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;">
  <tr><td style="background:${GREEN};padding:28px 32px;">
    <p style="margin:0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${GOLD};font-family:Georgia,serif;">${esc(weekLabel)}</p>
    <h1 style="margin:8px 0 0;font-size:24px;line-height:1.3;color:${CREAM};font-family:Georgia,serif;font-weight:500;">This week in Ubud</h1>
  </td></tr>
  <tr><td style="padding:20px 32px 6px;">
    <p style="margin:0;font-size:14px;line-height:1.6;color:${CHARCOAL};font-family:Georgia,serif;">${intro}</p>
  </td></tr>
  ${buildDealsBlockHtml(deals, siteUrl)}
  ${eventsHeading}
  ${rows}
  <tr><td style="padding:24px 32px;">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="background:${GREEN};border-radius:6px;">
        <a href="${siteUrl}/events" style="display:inline-block;padding:12px 28px;font-size:14px;color:${CREAM};text-decoration:none;font-family:Georgia,serif;">Browse the full agenda</a>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:4px 32px 22px;">
    <p style="margin:0;font-size:13px;line-height:1.6;color:${CHARCOAL};font-family:Georgia,serif;">
      Know someone in Ubud who'd like this?
      <a href="https://wa.me/?text=${encodeURIComponent(`Ubud's best deals and what's on, one email every Wednesday: ${siteUrl}/newsletter`)}" style="color:${GREEN};">Share it on WhatsApp</a>.
      They can sign up at <a href="${siteUrl}/newsletter" style="color:${GREEN};">theubudian.life/newsletter</a>.
    </p>
  </td></tr>
  ${emailFooter(unsubUrl)}
</table>
</td></tr>
</table>
</body></html>`;
}
