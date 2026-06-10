import { GREEN, GOLD, CREAM, CHARCOAL, esc, fmtEmailDate, emailFooter } from "@/lib/email/brand";
import { ARCHETYPES } from "@/lib/quiz-data";
import { formatEventTime } from "@/lib/utils";
import type { ArchetypeId, Event } from "@/types";

/**
 * "This week in your Ubud" — the weekly For-You digest. Personalised via the
 * taker's archetype when they have one; the saved-only variant drops the
 * archetype framing and leads with the week itself.
 */
export function buildWeeklyDigestEmailHtml(opts: {
  archetype: ArchetypeId | null;
  events: Event[];
  siteUrl: string;
  unsubUrl: string;
  weekLabel: string;
}): string {
  const { archetype, events, siteUrl, unsubUrl, weekLabel } = opts;
  const a = archetype ? ARCHETYPES[archetype] : null;

  const intro = a
    ? `Picked for ${esc(a.name)} — what's moving in the valley this week.`
    : `What's moving in the valley this week, picked from the gatherings you've been saving.`;

  const rows = events
    .map((e) => {
      const when = [fmtEmailDate(e.start_date), formatEventTime(e.start_time, e.end_time)]
        .filter(Boolean)
        .join(" · ");
      const where = e.venue_name ? ` · ${esc(e.venue_name)}` : "";
      return `
  <tr><td style="padding:14px 32px;border-top:1px solid ${GOLD}22;">
    <a href="${siteUrl}/events/${e.slug}" style="text-decoration:none;">
      <p style="margin:0;font-size:17px;color:${GREEN};font-family:Georgia,serif;font-weight:500;">${esc(e.title)}</p>
    </a>
    <p style="margin:4px 0 0;font-size:13px;color:${CHARCOAL}aa;font-family:Georgia,serif;">${esc(when)}${where}</p>
  </td></tr>`;
    })
    .join("");

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:${CREAM};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;">
  <tr><td style="background:${GREEN};padding:28px 32px;">
    <p style="margin:0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${GOLD};font-family:Georgia,serif;">${esc(weekLabel)}</p>
    <h1 style="margin:8px 0 0;font-size:24px;line-height:1.3;color:${CREAM};font-family:Georgia,serif;font-weight:500;">This week in your Ubud</h1>
  </td></tr>
  <tr><td style="padding:20px 32px 6px;">
    <p style="margin:0;font-size:14px;line-height:1.6;color:${CHARCOAL};font-family:Georgia,serif;">${intro}</p>
  </td></tr>
  ${rows}
  <tr><td style="padding:24px 32px;">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="background:${GREEN};border-radius:6px;">
        <a href="${siteUrl}/events" style="display:inline-block;padding:12px 28px;font-size:14px;color:${CREAM};text-decoration:none;font-family:Georgia,serif;">Browse the full agenda</a>
      </td>
    </tr></table>
  </td></tr>
  ${emailFooter(unsubUrl)}
</table>
</td></tr>
</table>
</body></html>`;
}
