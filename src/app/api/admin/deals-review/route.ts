import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { applyDecisions, decisionsSchema } from "@/lib/venue/review";

/** An admin decides by hand (same rules as the daily routine). */
export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ data: null, error: "Not allowed" }, { status: 403 });
  const parsed = decisionsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ data: null, error: "Invalid decision" }, { status: 400 });
  return NextResponse.json({ data: await applyDecisions(parsed.data.decisions), error: null });
}
