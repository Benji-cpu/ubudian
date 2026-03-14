/**
 * POST /api/admin/ingestion/messages/reparse-failed
 *
 * Batch re-process all failed raw messages through the parsing pipeline.
 * Resets each message to pending and runs processRawMessage sequentially.
 *
 * Admin-only.
 */

import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { processRawMessage } from "@/lib/ingestion";
import type { RawMessage } from "@/lib/ingestion";

export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Fetch failed messages and stale pending messages (limit 50)
  const TEN_MINUTES_AGO = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const { data: failedMessages, error: fetchError } = await supabase
    .from("raw_ingestion_messages")
    .select("*")
    .or(`status.eq.failed,and(status.eq.pending,updated_at.lt.${TEN_MINUTES_AGO})`)
    .order("created_at", { ascending: true })
    .limit(50);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!failedMessages?.length) {
    return NextResponse.json({ total: 0, results: [] });
  }

  const results: Array<{ id: string; status: string; error?: string }> = [];

  for (const message of failedMessages) {
    // Reset message status
    await supabase
      .from("raw_ingestion_messages")
      .update({
        status: "pending",
        parse_error: null,
        parsed_event_data: null,
        event_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", message.id);

    // Get source config
    const { data: source } = await supabase
      .from("event_sources")
      .select("config")
      .eq("id", message.source_id)
      .single();

    const rawMsg: RawMessage = {
      external_id: message.external_id,
      content_text: message.content_text,
      content_html: message.content_html,
      image_urls: message.image_urls,
      sender_name: message.sender_name,
      sender_id: message.sender_id,
      raw_data: message.raw_data,
    };

    try {
      const result = await processRawMessage(
        message.id,
        rawMsg,
        message.source_id,
        source?.config || {}
      );
      results.push({ id: message.id, status: result.status });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      results.push({ id: message.id, status: "failed", error: errorMsg });
    }
  }

  return NextResponse.json({
    total: failedMessages.length,
    results,
  });
}
