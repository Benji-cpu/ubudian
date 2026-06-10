import { GREEN, GOLD, CREAM, CHARCOAL, esc, fmtEmailDate, emailFooter } from "@/lib/email/brand";
import { formatEventTime } from "@/lib/utils";
import type { Event } from "@/types";

/**
 * "Starts tomorrow" reminder for a saved event. One event per email — saves
 * are individual gestures and the reminder should feel like one too.
 */
export function buildEventReminderEmailHtml(opts: {
  event: Event;
  occurrenceDate: string;
  siteUrl: string;
  unsubUrl: string;
}): string {
  const { event, occurrenceDate, siteUrl, unsubUrl } = opts;
  const when = [fmtEmailDate(occurrenceDate), formatEventTime(event.start_time, event.end_time)]
    .filter(Boolean)
    .join(" · ");
  const eventUrl = `${siteUrl}/events/${event.slug}`;

  const cover = event.cover_image_url
    ? `<tr><td><a href="${eventUrl}"><img src="${esc(event.cover_image_url)}" alt="" width="600" style="display:block;width:100%;max-height:280px;object-fit:cover;border-radius:8px 8px 0 0;" /></a></td></tr>`
    : "";

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:${CREAM};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;">
  ${cover}
  <tr><td style="padding:32px;">
    <p style="margin:0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${GOLD};font-family:Georgia,serif;">Tomorrow, in the valley</p>
    <h1 style="margin:8px 0 0;font-size:26px;line-height:1.25;color:${GREEN};font-family:Georgia,serif;font-weight:500;">${esc(event.title)}</h1>
    <p style="margin:14px 0 0;font-size:15px;color:${CHARCOAL};font-family:Georgia,serif;">${esc(when)}${event.venue_name ? ` · ${esc(event.venue_name)}` : ""}</p>
    ${event.short_description ? `<p style="margin:14px 0 0;font-size:14px;line-height:1.6;color:${CHARCOAL}cc;font-family:Georgia,serif;">${esc(event.short_description)}</p>` : ""}
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;"><tr>
      <td style="background:${GREEN};border-radius:6px;">
        <a href="${eventUrl}" style="display:inline-block;padding:12px 28px;font-size:14px;color:${CREAM};text-decoration:none;font-family:Georgia,serif;">Event details</a>
      </td>
    </tr></table>
    <p style="margin:18px 0 0;font-size:12px;color:${CHARCOAL}99;font-family:Georgia,serif;">You saved this one — we figured you'd want the nudge.</p>
  </td></tr>
  ${emailFooter(unsubUrl)}
</table>
</td></tr>
</table>
</body></html>`;
}
