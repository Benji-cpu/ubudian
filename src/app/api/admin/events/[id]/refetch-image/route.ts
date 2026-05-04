import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { enrichFromUrls } from "@/lib/ingestion/url-enricher";
import { persistRemoteImage } from "@/lib/ingestion/image-persistence";

export const maxDuration = 30;

const idSchema = z.string().uuid();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid event id" }, { status: 400 });
  }

  const ip = getClientIp(request);
  const { success } = rateLimit(`refetch-image:${ip}`, { limit: 60, windowSeconds: 3600 });
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const supabase = createAdminClient();
  const { data: event, error } = await supabase
    .from("events")
    .select("id, title, source_url, external_ticket_url")
    .eq("id", parsed.data)
    .single();

  if (error || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const candidates = [event.source_url, event.external_ticket_url].filter(
    (u): u is string => typeof u === "string" && u.length > 0
  );
  if (candidates.length === 0) {
    return NextResponse.json(
      { error: "No source_url or external_ticket_url on this event." },
      { status: 422 }
    );
  }

  const enrichment = await enrichFromUrls(candidates, { cover_image_url: null });
  if (!enrichment.cover_image_url) {
    return NextResponse.json(
      { error: "No image found at the candidate URLs.", candidates },
      { status: 404 }
    );
  }

  const stored = await persistRemoteImage(enrichment.cover_image_url, "events", event.id);
  if (!stored) {
    return NextResponse.json(
      { error: "Failed to download or upload the image.", foundImage: enrichment.cover_image_url },
      { status: 502 }
    );
  }

  const { error: updateError } = await supabase
    .from("events")
    .update({ cover_image_url: stored })
    .eq("id", event.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ url: stored, foundImage: enrichment.cover_image_url });
}
