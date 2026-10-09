import { NextResponse } from "next/server";
import { apply, parseFindings, todo } from "@/lib/deals/scout";
import { isDealsReviewAuthorised } from "@/lib/venue/review-auth";

/**
 * The nightly deals scout, on the same private bus and key as the deals review:
 *   GET  → tonight's venues to check (public fields only; the bus fetch commits it)
 *   POST → what the routine found (the bus apply posts it). Found specials are
 *          stored hidden; nothing here publishes.
 */
function authorised(request: Request) {
  return isDealsReviewAuthorised(request.headers.get("authorization"));
}

export async function GET(request: Request) {
  if (!authorised(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await todo();
  return NextResponse.json({ generatedAt: new Date().toISOString(), count: items.length, items });
}

export async function POST(request: Request) {
  if (!authorised(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = parseFindings(await request.json().catch(() => null));
  if (!parsed) return NextResponse.json({ error: "Invalid findings" }, { status: 400 });
  const report = await apply(parsed.findings);
  return NextResponse.json({ data: { ...report, skipped: parsed.skipped }, error: null });
}
