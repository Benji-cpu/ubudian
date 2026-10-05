/**
 * POST /api/events/suggest — "Know a teacher, venue or event we're missing?"
 * Anonymous. Stores the message; only the Instagram handles and links in it
 * are passed on to the events desk's weekly source research.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { BOT_UA, extractSuggestion, ipHash } from "@/lib/events/signals";

const schema = z.object({
  body: z.string().trim().min(3).max(500),
  website: z.string().optional(), // honeypot
});

export async function POST(request: Request) {
  let data: z.infer<typeof schema>;
  try {
    data = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ data: null, error: "Please add an Instagram handle or a link." }, { status: 400 });
  }
  // Honeypot or bot: pretend it worked.
  if (data.website || BOT_UA.test(request.headers.get("user-agent") ?? "")) {
    return NextResponse.json({ data: { ok: true }, error: null });
  }
  const hash = ipHash(request);
  const { success } = rateLimit(`suggest:${hash}`, { limit: 5, windowSeconds: 3600 });
  if (!success) return NextResponse.json({ data: null, error: "Thanks! That's plenty for now." }, { status: 429 });

  const { handles, urls } = extractSuggestion(data.body);
  const { error } = await createAdminClient()
    .from("source_suggestions")
    .insert({ body: data.body, handles, urls, ip_hash: hash, status: handles.length || urls.length ? "new" : "ignored" });
  if (error) return NextResponse.json({ data: null, error: "Could not save. Try again?" }, { status: 500 });
  return NextResponse.json({ data: { ok: true }, error: null });
}
