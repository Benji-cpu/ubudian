/**
 * GET /api/admin/ingestion/venues/unresolved — List unresolved venues
 * POST /api/admin/ingestion/venues/unresolved — Resolve or ignore a venue
 *
 * Admin-only.
 */

import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { clearVenueAliasCache } from "@/lib/ingestion";

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = request.nextUrl.searchParams.get("status") || "unresolved";

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("unresolved_venues")
    .select("*")
    .eq("status", status)
    .order("seen_count", { ascending: false });

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
    const { id, action, canonical_name } = await request.json();

    if (!id || !action) {
      return NextResponse.json(
        { error: "id and action are required" },
        { status: 400 }
      );
    }

    if (action !== "resolve" && action !== "ignore") {
      return NextResponse.json(
        { error: "action must be 'resolve' or 'ignore'" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    if (action === "resolve") {
      if (!canonical_name?.trim()) {
        return NextResponse.json(
          { error: "canonical_name is required for resolve action" },
          { status: 400 }
        );
      }

      // Get the unresolved venue to use its raw_name as the alias
      const { data: venue, error: fetchError } = await supabase
        .from("unresolved_venues")
        .select("raw_name")
        .eq("id", id)
        .single();

      if (fetchError || !venue) {
        return NextResponse.json(
          { error: "Unresolved venue not found" },
          { status: 404 }
        );
      }

      // Create venue alias
      const { error: aliasError } = await supabase
        .from("venue_aliases")
        .insert({
          canonical_name: canonical_name.trim(),
          alias: venue.raw_name,
        });

      if (aliasError && aliasError.code !== "23505") {
        return NextResponse.json({ error: aliasError.message }, { status: 500 });
      }

      // Mark as resolved
      const { error: updateError } = await supabase
        .from("unresolved_venues")
        .update({
          status: "resolved",
          resolved_canonical_name: canonical_name.trim(),
          resolved_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      // Clear cache so new alias takes effect
      clearVenueAliasCache();

      return NextResponse.json({ success: true, action: "resolved" });
    }

    // action === "ignore"
    const { error: updateError } = await supabase
      .from("unresolved_venues")
      .update({ status: "ignored" })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, action: "ignored" });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
