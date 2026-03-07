/**
 * GET /api/admin/ingestion/sources — List all event sources
 * POST /api/admin/ingestion/sources — Create a new event source
 *
 * Admin-only endpoints.
 */

import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const createSourceSchema = z.object({
  name: z.string().min(1).max(200),
  source_type: z.enum([
    "telegram",
    "api",
    "scraper",
    "whatsapp",
    "facebook",
    "instagram",
    "manual",
  ]),
  config: z.record(z.string(), z.unknown()).optional().default({}),
  is_enabled: z.boolean().optional().default(true),
  fetch_interval_minutes: z.number().int().min(5).optional().default(240),
});

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("event_sources")
    .select("*")
    .order("created_at", { ascending: false });

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
    const body = await request.json();
    const data = createSourceSchema.parse(body);

    const supabase = createAdminClient();

    // Generate slug from name
    let slug = slugify(data.name);
    const { data: existing } = await supabase
      .from("event_sources")
      .select("slug")
      .eq("slug", slug)
      .single();

    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const { data: source, error } = await supabase
      .from("event_sources")
      .insert({
        name: data.name,
        slug,
        source_type: data.source_type,
        config: data.config,
        is_enabled: data.is_enabled,
        fetch_interval_minutes: data.fetch_interval_minutes,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(source, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
