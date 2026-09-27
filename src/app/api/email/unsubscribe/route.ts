import { createAdminClient } from "@/lib/supabase/admin";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// One-click unsubscribe from everything The Ubudian sends to subscribers: the
// weekly email, saved-event reminders and the quiz spread. GET renders a tiny
// branded confirmation page (humans land here from the footer link); POST is
// the RFC 8058 one-click call mail clients make from the List-Unsubscribe
// header. Both stop the address on the profile and the subscriber list.

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

type Outcome = "ok" | "invalid" | "limited" | "failed";

async function unsubscribe(request: Request): Promise<Outcome> {
  const { success } = rateLimit(`unsubscribe:${getClientIp(request)}`, { limit: 10, windowSeconds: 600 });
  if (!success) return "limited";

  const url = new URL(request.url);
  const email = (url.searchParams.get("email") || "").toLowerCase().trim();
  const token = url.searchParams.get("token") || "";
  if (!email || !token || !verifyUnsubscribeToken(email, token)) return "invalid";

  try {
    const supabase = createAdminClient();
    const [profiles, subscribers] = await Promise.all([
      supabase.from("profiles").update({ email_opt_out: true }).eq("email", email),
      supabase.from("newsletter_subscribers").update({ status: "unsubscribed" }).eq("email", email),
    ]);
    if (profiles.error || subscribers.error) throw profiles.error ?? subscribers.error;
    return "ok";
  } catch (err) {
    console.error("[unsubscribe] failed:", err);
    return "failed";
  }
}

export async function GET(request: Request) {
  switch (await unsubscribe(request)) {
    case "limited":
      return page("Too many requests", "Please try again in a few minutes.");
    case "invalid":
      return page(
        "Link not valid",
        "This unsubscribe link is incomplete or expired. Reply to any of our emails and we'll sort it out by hand."
      );
    case "failed":
      return page(
        "Something went wrong",
        "We couldn't process that just now. Reply to any of our emails and we'll sort it out by hand."
      );
    default:
      return page("You're unsubscribed", "You won't get any more emails from The Ubudian.");
  }
}

export async function POST(request: Request) {
  const outcome = await unsubscribe(request);
  const status = outcome === "ok" ? 200 : outcome === "invalid" ? 400 : outcome === "limited" ? 429 : 500;
  return new Response(null, { status });
}
