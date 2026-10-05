import { NextResponse } from "next/server";
import { applyDecisions, decisionsSchema, listForReview } from "@/lib/venue/review";

/**
 * The daily deals review (git-as-bus, like the curator):
 *   GET  → what's waiting, public fields only (deals-review-fetch.yml commits it)
 *   POST → the routine's decisions (deals-review-apply.yml posts them)
 * Both need `Authorization: Bearer ${CRON_SECRET}`.
 */
function authorised(request: Request) {
  return request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
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
