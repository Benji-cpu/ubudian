import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { persistRemoteImage } from "@/lib/ingestion/image-persistence";

/**
 * Copies hot-linked event covers (todo.today, Megatix, venue sites) into the
 * Supabase `images` bucket under `events/`, so a card never goes blank when a
 * source's CDN blocks hot-linking or moves a file, and we stop leaning on their
 * bandwidth. The event page still credits the source through its source link.
 *
 * Called by GH Actions (`aggregator-harvest`) after the harvests, a few times in
 * a row; each call works ~45s and reports how many remain. Approved events first,
 * then pending ones nearest in date. A cover that can't be fetched is left as is.
 */
export const maxDuration = 60;

const BUDGET_MS = 45_000;
const BATCH = 40;

export async function POST(request: Request) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const started = Date.now();
  const supabase = createAdminClient();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Makassar" }).format(new Date());

  const pick = async (status: "approved" | "pending") => {
    const { data, error } = await supabase
      .from("events")
      .select("id, cover_image_url")
      .eq("status", status)
      .like("cover_image_url", "http%")
      .not("cover_image_url", "like", "%supabase.co%")
      .or(`end_date.gte.${today},start_date.gte.${today},is_recurring.eq.true`)
      .order("start_date", { ascending: true })
      .limit(BATCH);
    if (error) throw new Error(error.message);
    return data ?? [];
  };

  // Approved first, each group shuffled, so a cover that always fails (a CDN
  // that refuses us) can't hold the same slots every run.
  const shuffle = <T,>(xs: T[]) =>
    xs.map((x) => [Math.random(), x] as const).sort((a, b) => a[0] - b[0]).map(([, x]) => x);

  let candidates: { id: string; cover_image_url: string | null }[];
  try {
    candidates = [...shuffle(await pick("approved")), ...shuffle(await pick("pending"))];
  } catch (err) {
    return NextResponse.json({ data: null, error: String(err) }, { status: 500 });
  }

  let persisted = 0;
  let failed = 0;
  let processed = 0;
  for (const ev of candidates) {
    if (Date.now() - started > BUDGET_MS) break;
    processed++;
    const stored = ev.cover_image_url ? await persistRemoteImage(ev.cover_image_url, "events", ev.id) : null;
    if (!stored) { failed++; continue; }
    const { error } = await supabase.from("events").update({ cover_image_url: stored }).eq("id", ev.id);
    if (error) failed++;
    else persisted++;
  }

  return NextResponse.json({
    data: { persisted, failed, processed, remaining: candidates.length - processed },
    error: null,
  });
}
