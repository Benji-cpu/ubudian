const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://theubudian.com";

const COLORS = {
  deepGreen: "#2C4A3E",
  gold: "#C9A84C",
  cream: "#FAF5EC",
  charcoal: "#2D2D2D",
};

function layout(body: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background-color:${COLORS.cream};font-family:'Source Sans 3',Arial,sans-serif;color:${COLORS.charcoal};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.cream};">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <!-- Header -->
          <tr>
            <td style="background-color:${COLORS.deepGreen};padding:20px 24px;text-align:center;">
              <span style="font-family:'Lora',Georgia,serif;font-size:22px;font-weight:700;color:${COLORS.gold};">The Ubudian</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:32px 24px;font-size:16px;line-height:1.6;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 24px;text-align:center;font-size:13px;color:#888;">
              <a href="${SITE_URL}" style="color:${COLORS.deepGreen};text-decoration:none;">theubudian.com</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

export function eventSubmissionConfirmation(eventName: string, autoApproved: boolean): string {
  const statusMessage = autoApproved
    ? `<p>As a trusted submitter, your event has been <strong>automatically approved</strong> and is now live on our events page.</p>`
    : `<p>Our team will review your submission shortly. You&rsquo;ll receive an email once it&rsquo;s been approved.</p>`;

  return layout(`
    <h2 style="margin:0 0 16px;font-family:'Lora',Georgia,serif;color:${COLORS.deepGreen};">Thanks for submitting!</h2>
    <p>We&rsquo;ve received your event: <strong>${escapeHtml(eventName)}</strong></p>
    ${statusMessage}
    <p style="margin-top:24px;font-size:14px;color:#666;">Have questions? Just reply to this email.</p>
  `);
}

export function eventApprovedNotification(eventName: string, slug: string): string {
  const eventUrl = `${SITE_URL}/events/${slug}`;

  return layout(`
    <h2 style="margin:0 0 16px;font-family:'Lora',Georgia,serif;color:${COLORS.deepGreen};">Your event is live!</h2>
    <p><strong>${escapeHtml(eventName)}</strong> has been approved and is now visible on The Ubudian.</p>
    <p style="margin-top:20px;">
      <a href="${eventUrl}" style="display:inline-block;padding:10px 24px;background-color:${COLORS.deepGreen};color:#ffffff;text-decoration:none;border-radius:4px;font-weight:600;">View Your Event</a>
    </p>
  `);
}

export function eventRejectedNotification(eventName: string, reason?: string): string {
  const reasonBlock = reason
    ? `<p style="margin-top:12px;padding:12px 16px;background-color:${COLORS.cream};border-radius:4px;font-size:14px;"><strong>Reason:</strong> ${escapeHtml(reason)}</p>`
    : "";

  return layout(`
    <h2 style="margin:0 0 16px;font-family:'Lora',Georgia,serif;color:${COLORS.deepGreen};">Event not approved</h2>
    <p>Unfortunately, <strong>${escapeHtml(eventName)}</strong> was not approved for listing on The Ubudian.</p>
    ${reasonBlock}
    <p style="margin-top:16px;">If you have questions or would like to resubmit, feel free to reply to this email.</p>
  `);
}

export function newsletterWelcome(): string {
  return layout(`
    <h2 style="margin:0 0 16px;font-family:'Lora',Georgia,serif;color:${COLORS.deepGreen};">Welcome to The Ubudian!</h2>
    <p>You&rsquo;re now part of our community. Every week, we&rsquo;ll send you a curated newsletter with:</p>
    <ul style="padding-left:20px;margin:16px 0;">
      <li>The best events happening in Ubud</li>
      <li>Stories from the people who make this place special</li>
      <li>Hidden gems, new openings, and local tips</li>
    </ul>
    <p>In the meantime, explore what&rsquo;s on:</p>
    <p style="margin-top:20px;">
      <a href="${SITE_URL}/events" style="display:inline-block;padding:10px 24px;background-color:${COLORS.deepGreen};color:#ffffff;text-decoration:none;border-radius:4px;font-weight:600;">Browse Events</a>
    </p>
    <p style="margin-top:24px;padding-top:20px;border-top:1px solid #eee;font-size:14px;color:#666;">
      Want personalized event recommendations? Take the 90-second Ubud Spirit Quiz:
      <a href="${SITE_URL}/quiz" style="color:#B85C3F;text-decoration:underline;font-weight:600;">Take the Quiz</a>
    </p>
  `);
}

// ============================================
// BOOKING EMAIL TEMPLATES
// ============================================

export function bookingConfirmation(opts: {
  guestName: string;
  tourTitle: string;
  bookingReference: string;
  preferredDate: string;
  numGuests: number;
  totalAmount: string;
}): string {
  return layout(`
    <h2 style="margin:0 0 16px;font-family:'Lora',Georgia,serif;color:${COLORS.deepGreen};">Booking Confirmed!</h2>
    <p>Hi ${escapeHtml(opts.guestName)}, your tour booking has been confirmed.</p>
    <table style="margin:16px 0;width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:8px 0;color:#888;">Tour</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(opts.tourTitle)}</td></tr>
      <tr><td style="padding:8px 0;color:#888;">Reference</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(opts.bookingReference)}</td></tr>
      <tr><td style="padding:8px 0;color:#888;">Date</td><td style="padding:8px 0;">${escapeHtml(opts.preferredDate)}</td></tr>
      <tr><td style="padding:8px 0;color:#888;">Guests</td><td style="padding:8px 0;">${opts.numGuests}</td></tr>
      <tr><td style="padding:8px 0;color:#888;">Total Paid</td><td style="padding:8px 0;font-weight:600;color:#B85C3F;">${escapeHtml(opts.totalAmount)}</td></tr>
    </table>
    <p style="margin-top:16px;">We&rsquo;ll be in touch with any details about your tour. If you have questions, just reply to this email.</p>
    <p style="margin-top:20px;">
      <a href="${SITE_URL}/tours" style="display:inline-block;padding:10px 24px;background-color:${COLORS.deepGreen};color:#ffffff;text-decoration:none;border-radius:4px;font-weight:600;">Browse More Tours</a>
    </p>
  `);
}

export function bookingNotificationAdmin(opts: {
  guestName: string;
  guestEmail: string;
  tourTitle: string;
  bookingReference: string;
  preferredDate: string;
  numGuests: number;
  totalAmount: string;
}): string {
  return layout(`
    <h2 style="margin:0 0 16px;font-family:'Lora',Georgia,serif;color:${COLORS.deepGreen};">New Tour Booking</h2>
    <p>A new booking has been confirmed:</p>
    <table style="margin:16px 0;width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:8px 0;color:#888;">Reference</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(opts.bookingReference)}</td></tr>
      <tr><td style="padding:8px 0;color:#888;">Tour</td><td style="padding:8px 0;">${escapeHtml(opts.tourTitle)}</td></tr>
      <tr><td style="padding:8px 0;color:#888;">Guest</td><td style="padding:8px 0;">${escapeHtml(opts.guestName)} (${escapeHtml(opts.guestEmail)})</td></tr>
      <tr><td style="padding:8px 0;color:#888;">Date</td><td style="padding:8px 0;">${escapeHtml(opts.preferredDate)}</td></tr>
      <tr><td style="padding:8px 0;color:#888;">Guests</td><td style="padding:8px 0;">${opts.numGuests}</td></tr>
      <tr><td style="padding:8px 0;color:#888;">Total</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(opts.totalAmount)}</td></tr>
    </table>
    <p style="margin-top:20px;">
      <a href="${SITE_URL}/admin/bookings" style="display:inline-block;padding:10px 24px;background-color:${COLORS.deepGreen};color:#ffffff;text-decoration:none;border-radius:4px;font-weight:600;">View in Admin</a>
    </p>
  `);
}

export function bookingCancellation(opts: {
  guestName: string;
  tourTitle: string;
  bookingReference: string;
  refunded: boolean;
}): string {
  const refundMsg = opts.refunded
    ? `<p>A full refund has been issued. It may take 5&ndash;10 business days to appear on your statement.</p>`
    : `<p>No charges were made for this booking.</p>`;

  return layout(`
    <h2 style="margin:0 0 16px;font-family:'Lora',Georgia,serif;color:${COLORS.deepGreen};">Booking Cancelled</h2>
    <p>Hi ${escapeHtml(opts.guestName)}, your booking for <strong>${escapeHtml(opts.tourTitle)}</strong> (${escapeHtml(opts.bookingReference)}) has been cancelled.</p>
    ${refundMsg}
    <p style="margin-top:16px;">If you have questions, just reply to this email.</p>
  `);
}

export function feedbackNotification(opts: {
  type: string;
  message: string;
  pageUrl: string | null;
  email: string | null;
}): string {
  const typeLabel = opts.type.charAt(0).toUpperCase() + opts.type.slice(1);
  const preview = opts.message.length > 200 ? opts.message.slice(0, 200) + "..." : opts.message;
  const pageRow = opts.pageUrl
    ? `<tr><td style="padding:8px 0;color:#888;">Page</td><td style="padding:8px 0;"><a href="${escapeHtml(opts.pageUrl)}" style="color:${COLORS.deepGreen};text-decoration:underline;">${escapeHtml(opts.pageUrl)}</a></td></tr>`
    : "";
  const emailRow = opts.email
    ? `<tr><td style="padding:8px 0;color:#888;">From</td><td style="padding:8px 0;">${escapeHtml(opts.email)}</td></tr>`
    : "";

  return layout(`
    <h2 style="margin:0 0 16px;font-family:'Lora',Georgia,serif;color:${COLORS.deepGreen};">New Feedback: ${typeLabel}</h2>
    <table style="margin:16px 0;width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:8px 0;color:#888;">Type</td><td style="padding:8px 0;font-weight:600;">${typeLabel}</td></tr>
      ${emailRow}
      ${pageRow}
    </table>
    <div style="margin:16px 0;padding:12px 16px;background-color:${COLORS.cream};border-radius:4px;font-size:14px;white-space:pre-wrap;">${escapeHtml(preview)}</div>
    <p style="margin-top:20px;">
      <a href="${SITE_URL}/admin/feedback" style="display:inline-block;padding:10px 24px;background-color:${COLORS.deepGreen};color:#ffffff;text-decoration:none;border-radius:4px;font-weight:600;">View in Admin</a>
    </p>
  `);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
