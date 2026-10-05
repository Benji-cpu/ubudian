import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { createVenue } from "@/lib/venue";
import { newVenueSchema } from "@/lib/venue/schema";

/** A signed-in owner adds a venue that isn't listed yet. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ data: null, error: "Sign in first." }, { status: 401 });
  if (!rateLimit(`venue-create:${user.id}`, { limit: 3, windowSeconds: 3600 }).success) {
    return NextResponse.json({ data: null, error: "Too many requests. Please try again later." }, { status: 429 });
  }
  const parsed = newVenueSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ data: null, error: parsed.error.issues[0]?.message ?? "Please check the form." }, { status: 400 });
  }
  if (parsed.data.website) return NextResponse.json({ data: { venueId: null }, error: null }); // honeypot
  const venue = await createVenue(user.id, parsed.data);
  if (!venue) {
    return NextResponse.json(
      { data: null, error: "That venue is already listed. Use the link in our email to manage it, or tap the feedback button." },
      { status: 409 }
    );
  }
  return NextResponse.json({ data: { venueId: venue.id }, error: null });
}
