import { GREEN, GOLD, CREAM, CHARCOAL, esc, fmtEmailDate } from "@/lib/email/brand";

/**
 * "Is your special still running?" — sent a week before a listing lapses.
 * The button opens a page with a confirm button (a POST), so a mail
 * scanner following the link can't confirm on the venue's behalf.
 */
export function buildSpecialReconfirmEmailHtml(opts: {
  venueName: string;
  titles: string[];
  expiresOn: string;
  confirmUrl: string;
}): string {
  const { venueName, titles, expiresOn, confirmUrl } = opts;
  const list = titles
    .map((t) => `<li style="margin:4px 0;">${esc(t)}</li>`)
    .join("");
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:${CREAM};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;">
  <tr><td style="padding:32px;">
    <p style="margin:0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${GOLD};font-family:Georgia,serif;">Tonight in Ubud</p>
    <h1 style="margin:8px 0 0;font-size:24px;line-height:1.3;color:${GREEN};font-family:Georgia,serif;font-weight:500;">Still running at ${esc(venueName)}?</h1>
    <p style="margin:14px 0 0;font-size:15px;line-height:1.6;color:${CHARCOAL};font-family:Georgia,serif;">Your listing on The Ubudian comes off on ${esc(fmtEmailDate(expiresOn))} unless you tell us it's still on:</p>
    <ul style="margin:10px 0 0;padding-left:20px;font-size:15px;color:${CHARCOAL};font-family:Georgia,serif;">${list}</ul>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;"><tr>
      <td style="background:${GREEN};border-radius:6px;">
        <a href="${esc(confirmUrl)}" style="display:inline-block;padding:12px 28px;font-size:14px;color:${CREAM};text-decoration:none;font-family:Georgia,serif;">Yes, keep it listed</a>
      </td>
    </tr></table>
    <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:${CHARCOAL}99;font-family:Georgia,serif;">One tap keeps it up for another month. If something has stopped, you can say so on the same page. Listing stays free.</p>
  </td></tr>
  <tr><td style="padding:18px 32px;border-top:1px solid ${CREAM};font-size:11px;color:${CHARCOAL}88;font-family:Georgia,serif;">You're getting this because you listed a special on theubudian.life/tonight.</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}
