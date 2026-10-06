import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth";
import { markContacted, markOptedOut } from "@/lib/deals/outreach";

const schema = z.object({ venue_id: z.string().uuid(), action: z.enum(["instagram", "in_person", "optout"]) });

/** Ben records a hand-sent DM, a walk-in, or a "no thanks" that came by reply. */
export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ data: null, error: "Not allowed" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ data: null, error: "Invalid request" }, { status: 400 });
  const { venue_id, action } = parsed.data;
  if (action === "optout") await markOptedOut(venue_id);
  else await markContacted(venue_id, action);
  return NextResponse.json({ data: { ok: true }, error: null });
}
