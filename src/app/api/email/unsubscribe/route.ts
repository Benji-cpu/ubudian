import { createAdminClient } from "@/lib/supabase/admin";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// One-click unsubscribe from personalised transactional email (weekly digest
// + saved-event reminders). GET so it works from any mail client. Renders a
// tiny branded confirmation page rather than JSON — humans land here.

function page(title: string, body: string): Response {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} | The Ubudian</title>
<style>body{font-family:Georgia,serif;background:#FAF5EC;color:#2D2D2D;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px}
main{max-width:420px;text-align:center}h1{color:#2C4A3E;font-weight:500;font-size:1.6rem}p{line-height:1.6;color:#555}a{color:#2C4A3E}</style></head>
<body><main><h1>${title}</h1><p>${body}</p><p><a href="https://theubudian.life">theubudian.life</a></p></main></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const { success } = rateLimit(`unsubscribe:${ip}`, { limit: 10, windowSeconds: 600 });
  if (!success) {
    return page("Too many requests", "Please try again in a few minutes.");
  }

  const url = new URL(request.url);
  const email = (url.searchParams.get("email") || "").toLowerCase().trim();
  const token = url.searchParams.get("token") || "";

  if (!email || !token || !verifyUnsubscribeToken(email, token)) {
    return page(
      "Link not valid",
      "This unsubscribe link is incomplete or expired. Reply to any of our emails and we'll sort it out by hand."
    );
  }

  try {
    const supabase = createAdminClient();
    await supabase.from("profiles").update({ email_opt_out: true }).eq("email", email);
  } catch (err) {
    console.error("[unsubscribe] failed:", err);
    return page(
      "Something went wrong",
      "We couldn't process that just now. Reply to any of our emails and we'll sort it out by hand."
    );
  }

  return page(
    "You're unsubscribed",
    "No more personalised event emails from The Ubudian. The weekly newsletter (if you're on it) is managed separately via the link in its footer."
  );
}
