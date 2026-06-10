// Shared brand constants + tiny helpers for transactional email templates.
// spread-email.ts predates this file and keeps its own copies (it's live in
// the quiz path — left untouched on purpose); new templates import from here.

export const GREEN = "#2C4A3E";
export const GOLD = "#C9A84C";
export const CREAM = "#FAF5EC";
export const CHARCOAL = "#2D2D2D";

export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function fmtEmailDate(ymd: string | null): string {
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

export function emailFooter(unsubUrl: string): string {
  return `
  <tr><td style="padding:24px 32px;border-top:1px solid ${GOLD}33;">
    <p style="margin:0;font-size:12px;line-height:1.6;color:${CHARCOAL}99;font-family:Georgia,serif;">
      The Ubudian — the pulse of the valley.
      <a href="${unsubUrl}" style="color:${GREEN};">Unsubscribe</a> from personalised event emails.
    </p>
  </td></tr>`;
}
