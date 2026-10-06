import { NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { actOnInvite, inviteActionSchema } from "@/lib/deals/invite";

/** A venue answers from its private page (/v/<token>): adds a deal, says yes to one we found, or opts out. */
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { success } = rateLimit(`venue-invite:${getClientIp(request)}`, { limit: 20, windowSeconds: 3600 });
  if (!success) return NextResponse.json({ data: null, error: "Too many tries. Please try again later." }, { status: 429 });
  const parsed = inviteActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ data: null, error: parsed.error.issues[0]?.message ?? "Please check the form." }, { status: 400 });
  }
  const result = await actOnInvite(token, parsed.data);
  if (!result.ok) return NextResponse.json({ data: null, error: result.error }, { status: result.status });
  return NextResponse.json({ data: { ok: true }, error: null });
}
