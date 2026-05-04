import { createAdminClient } from "@/lib/supabase/admin";
import { getEventsForArchetype } from "@/lib/quiz-helpers";
import { NextResponse } from "next/server";
import type { ArchetypeId, Event } from "@/types";

const VALID_ARCHETYPES: ArchetypeId[] = ["seeker", "explorer", "creative", "connector", "epicurean"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const archetype = searchParams.get("archetype");

  if (!archetype || !VALID_ARCHETYPES.includes(archetype as ArchetypeId)) {
    return NextResponse.json(
      { error: "Invalid or missing archetype. Must be one of: seeker, explorer, creative, connector, epicurean" },
      { status: 400 }
    );
  }

  try {
    const supabase = createAdminClient();
    const today = new Date().toISOString().split("T")[0];

    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .eq("status", "approved")
      .gte("start_date", today)
      .order("start_date", { ascending: true })
      .limit(100);

    if (error) {
      console.error("Newsletter recommendations query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch events" },
        { status: 500 }
      );
    }

    const allEvents = (events ?? []) as Event[];
    const matched = getEventsForArchetype(allEvents, archetype as ArchetypeId, 8);

    return NextResponse.json({ data: matched });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
