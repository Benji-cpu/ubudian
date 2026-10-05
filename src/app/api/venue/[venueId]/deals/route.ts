import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { createVenueDeal, getOwnedVenue } from "@/lib/venue";
import { venueDealSchema } from "@/lib/venue/schema";

/** The owner adds a deal; it waits for the daily review. */
export async function POST(request: Request, { params }: { params: Promise<{ venueId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ data: null, error: "Sign in first." }, { status: 401 });
  const { venueId } = await params;
  if (!(await getOwnedVenue(venueId, user.id))) {
    return NextResponse.json({ data: null, error: "Not your venue." }, { status: 403 });
  }
  if (!rateLimit(`venue-deal:${user.id}`, { limit: 20, windowSeconds: 3600 }).success) {
    return NextResponse.json({ data: null, error: "Too many requests. Please try again later." }, { status: 429 });
  }
  const parsed = venueDealSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ data: null, error: parsed.error.issues[0]?.message ?? "Please check the form." }, { status: 400 });
  }
  const { error } = await createVenueDeal(venueId, user.id, parsed.data);
  if (error) return NextResponse.json({ data: null, error: "Couldn't save that. Please try again." }, { status: 500 });
  return NextResponse.json({ data: { status: "pending" }, error: null });
}
