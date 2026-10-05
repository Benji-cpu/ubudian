import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getOwnedVenue, takeDownVenueDeal, updateVenueDeal } from "@/lib/venue";
import { venueDealSchema } from "@/lib/venue/schema";

type Ctx = { params: Promise<{ venueId: string; dealId: string }> };

async function owner(ctx: Ctx) {
  const user = await getCurrentUser();
  if (!user) return { res: NextResponse.json({ data: null, error: "Sign in first." }, { status: 401 }) };
  const { venueId, dealId } = await ctx.params;
  if (!(await getOwnedVenue(venueId, user.id))) {
    return { res: NextResponse.json({ data: null, error: "Not your venue." }, { status: 403 }) };
  }
  return { userId: user.id, venueId, dealId };
}

/** Edit a deal. Live deals stay up while the change waits for review. */
export async function PATCH(request: Request, ctx: Ctx) {
  const o = await owner(ctx);
  if ("res" in o) return o.res;
  const parsed = venueDealSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ data: null, error: parsed.error.issues[0]?.message ?? "Please check the form." }, { status: 400 });
  }
  const { error } = await updateVenueDeal(o.dealId, o.venueId, o.userId, parsed.data);
  if (error === "not_found") return NextResponse.json({ data: null, error: "Deal not found." }, { status: 404 });
  if (error) return NextResponse.json({ data: null, error: "Couldn't save that. Please try again." }, { status: 500 });
  return NextResponse.json({ data: { status: "pending" }, error: null });
}

/** Take a deal down. Immediate; no review needed to remove something. */
export async function DELETE(_request: Request, ctx: Ctx) {
  const o = await owner(ctx);
  if ("res" in o) return o.res;
  const { error } = await takeDownVenueDeal(o.dealId, o.venueId);
  if (error) return NextResponse.json({ data: null, error: "Couldn't take it down. Please try again." }, { status: 500 });
  return NextResponse.json({ data: { status: "hidden" }, error: null });
}
