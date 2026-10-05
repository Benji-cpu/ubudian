import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { claimVenue } from "@/lib/venue";

/** A signed-in owner claims their venue with the private link we emailed them. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ data: null, error: "Sign in first." }, { status: 401 });
  const parsed = z.object({ token: z.string().uuid() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ data: null, error: "Invalid link." }, { status: 400 });
  const result = await claimVenue(parsed.data.token, user.id);
  if (!result.ok) {
    const error =
      result.reason === "taken"
        ? "Someone else already manages this venue. Use the feedback button and we'll sort it out."
        : "This link isn't valid any more.";
    return NextResponse.json({ data: null, error }, { status: result.reason === "taken" ? 409 : 404 });
  }
  return NextResponse.json({ data: { venueId: result.venue.id }, error: null });
}
