import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { nowInBali } from "@/lib/events/bali-time";
import { addDaysToDateStr, SPECIAL_LIFETIME_DAYS } from "@/lib/specials";
import { specialSubmissionSchema } from "@/lib/specials/schema";

/**
 * A restaurant adds its own special. It goes live straight away (no review
 * queue — see MEMORY.md) and lapses after SPECIAL_LIFETIME_DAYS unless it is
 * reconfirmed. Free text can't carry links, which is the spam guard; the
 * private contact fields are only for reconfirming.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { success } = rateLimit(`special-submit:${ip}`, { limit: 5, windowSeconds: 3600 });
  if (!success) {
    return NextResponse.json({ data: null, error: "Too many submissions. Please try again later." }, { status: 429 });
  }

  let data;
  try {
    data = specialSubmissionSchema.parse(await request.json());
  } catch (err) {
    const message =
      err instanceof z.ZodError ? err.issues[0]?.message ?? "Please check the form." : "Invalid request";
    return NextResponse.json({ data: null, error: message }, { status: 400 });
  }

  // Honeypot: pretend it worked.
  if (data.website) {
    return NextResponse.json({ data: { ok: true }, error: null });
  }

  const today = nowInBali().dateStr;
  const supabase = createAdminClient();
  const { error } = await supabase.from("specials").insert({
    venue_name: data.venue_name,
    venue_area: data.venue_area || null,
    venue_address: data.venue_address || null,
    instagram_handle: data.instagram_handle ? data.instagram_handle.replace(/^@/, "") : null,
    website_url: data.website_url || null,
    title: data.title,
    description: data.description || null,
    price_idr: data.price_idr ?? null,
    weekdays: [...new Set(data.weekdays)].sort((a, b) => a - b),
    start_time: data.start_time || null,
    end_time: data.end_time || null,
    status: "live",
    source: "form",
    contact_name: data.contact_name,
    contact_phone: data.contact_phone,
    contact_email: data.contact_email ? data.contact_email.toLowerCase() : null,
    expires_on: addDaysToDateStr(today, SPECIAL_LIFETIME_DAYS),
  });

  if (error) {
    console.error("Special submission error:", error.message);
    return NextResponse.json({ data: null, error: "Couldn't save your special. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ data: { ok: true, url: "/tonight" }, error: null });
}
