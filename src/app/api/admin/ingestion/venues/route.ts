/**
 * GET /api/admin/ingestion/venues — List venue aliases
 * POST /api/admin/ingestion/venues — Create a venue alias
 *
 * Admin-only.
 */

import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { clearVenueAliasCache } from "@/lib/ingestion";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("venue_aliases")
    .select("*")
    .order("canonical_name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { canonical_name, alias } = await request.json();

    if (!canonical_name?.trim() || !alias?.trim()) {
      return NextResponse.json(
        { error: "canonical_name and alias are required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("venue_aliases")
      .insert({
        canonical_name: canonical_name.trim(),
        alias: alias.trim(),
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "This alias already exists" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Clear the in-memory cache so new alias takes effect
    clearVenueAliasCache();

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
