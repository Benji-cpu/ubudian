import { NextResponse } from "next/server";
import { applyDecisions, decisionsSchema, listForReview } from "@/lib/venue/review";
import { isDealsReviewAuthorised } from "@/lib/venue/review-auth";

/**
 * The daily deals review (git-as-bus, like the curator):
 *   GET  → what's waiting, public fields only (deals-review-fetch.yml commits it)
 *   POST → the routine's decisions (deals-review-apply.yml posts them)
 * Both need `Authorization: Bearer <dealsReviewToken(CRON_SECRET)>`, a derived key (never CRON_SECRET itself).
 */
function authorised(request: Request) {
  // Its own derived key, NOT the site-wide CRON_SECRET (Reviewer §15): see review-auth.ts.
  return isDealsReviewAuthorised(request.headers.get("authorization"));
}

export async function GET(request: Request) {
  if (!authorised(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await listForReview();
  return NextResponse.json({ generatedAt: new Date().toISOString(), count: items.length, items });
}

export async function POST(request: Request) {
  if (!authorised(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = decisionsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid decisions" }, { status: 400 });
  const report = await applyDecisions(parsed.data.decisions);
  return NextResponse.json({ data: report, error: null });
}
