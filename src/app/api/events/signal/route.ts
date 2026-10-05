/**
 * POST /api/events/signal — anonymous reader signals for the events desk:
 * "I'm interested" (toggle) and ticket/source clicks (once a day per reader).
 * No sign-in. anon_id is a random id the browser keeps; the IP is only hashed
 * for rate limiting. Bots, our own test runs and admins are not counted.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { BOT_UA, ipHash } from "@/lib/events/signals";

const schema = z.object({
  event_id: z.string().uuid(),
  kind: z.enum(["interest", "ticket_click"]),
  anon_id: z.string().regex(/^[a-z0-9-]{8,64}$/i),
  remove: z.boolean().optional(),
});

export async function POST(request: Request) {
  if (BOT_UA.test(request.headers.get("user-agent") ?? "")) {
    return NextResponse.json({ data: { counted: false }, error: null });
  }
  const { success } = rateLimit(`signal:${ipHash(request)}`, { limit: 60, windowSeconds: 3600 });
  if (!success) return NextResponse.json({ data: null, error: "Too many requests" }, { status: 429 });

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ data: null, error: "Invalid signal" }, { status: 400 });
  }

  const profile = await getCurrentProfile().catch(() => null);
  if (profile?.role === "admin") return NextResponse.json({ data: { counted: false }, error: null });

  const supabase = createAdminClient();
  const { data: ev } = await supabase.from("events").select("id").eq("id", body.event_id).eq("status", "approved").maybeSingle();
  if (!ev) return NextResponse.json({ data: null, error: "Unknown event" }, { status: 404 });

  if (body.kind === "interest" && body.remove) {
    await supabase.from("event_signals").delete().eq("event_id", body.event_id).eq("anon_id", body.anon_id).eq("kind", "interest");
  } else {
    const { error } = await supabase.from("event_signals").insert({ event_id: body.event_id, kind: body.kind, anon_id: body.anon_id });
    // 23505 = already counted (once per reader, or once a day for clicks).
    if (error && error.code !== "23505") return NextResponse.json({ data: null, error: "Could not save" }, { status: 500 });
  }

  let interest: number | null = null;
  if (body.kind === "interest") {
    const { count } = await supabase
      .from("event_signals")
      .select("id", { count: "exact", head: true })
      .eq("event_id", body.event_id)
      .eq("kind", "interest");
    interest = count ?? 0;
  }
  return NextResponse.json({ data: { counted: true, interest }, error: null });
}
