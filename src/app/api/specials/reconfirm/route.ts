import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { applyReconfirm } from "@/lib/specials/reconfirm";

const schema = z.object({
  token: z.string().uuid(),
  stopped: z.array(z.string().uuid()).max(50).default([]),
  // Days picked for deals whose source gave none: { [specialId]: [0..6] }.
  days: z.record(z.string().uuid(), z.array(z.number().int().min(0).max(6)).max(7)).default({}),
});

/** A venue taps "still running" on its private link. The token is the only credential. */
export async function POST(request: Request) {
  const { success } = rateLimit(`special-reconfirm:${getClientIp(request)}`, { limit: 20, windowSeconds: 3600 });
  if (!success) {
    return NextResponse.json({ data: null, error: "Too many requests. Please try again later." }, { status: 429 });
  }

  let body;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ data: null, error: "Invalid request" }, { status: 400 });
  }

  try {
    const result = await applyReconfirm(body.token, body.stopped, body.days);
    if (!result) return NextResponse.json({ data: null, error: "This link isn't valid any more." }, { status: 404 });
    return NextResponse.json({ data: result, error: null });
  } catch (err) {
    console.error("Special reconfirm error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ data: null, error: "Couldn't save that. Please try again." }, { status: 500 });
  }
}
