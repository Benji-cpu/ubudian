/**
 * POST /api/admin/ingestion/run
 *
 * Manually trigger an ingestion run for a specific source.
 * Admin-only endpoint.
 *
 * Body: { sourceId: string }
 */

import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { runIngestion } from "@/lib/ingestion";

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { sourceId } = await request.json();

    if (!sourceId || typeof sourceId !== "string") {
      return NextResponse.json(
        { error: "sourceId is required" },
        { status: 400 }
      );
    }

    const result = await runIngestion(sourceId);

    return NextResponse.json(result);
  } catch (err) {
    console.error("[admin/ingestion/run] Error:", err);
    return NextResponse.json(
      { error: "Failed to run ingestion" },
      { status: 500 }
    );
  }
}
