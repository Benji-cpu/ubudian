/**
 * POST /api/admin/ingestion/messages/[id]/reparse
 *
 * Re-process a raw message through the parsing pipeline.
 * Useful for retrying failed or pending messages after fixing issues.
 *
 * Admin-only.
 */

import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { processRawMessage } from "@/lib/ingestion";
import type { RawMessage } from "@/lib/ingestion";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();

  // Fetch the raw message
  const { data: message, error } = await supabase
    .from("raw_ingestion_messages")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  // Get source config
  const { data: source } = await supabase
    .from("event_sources")
    .select("config")
    .eq("id", message.source_id)
    .single();

  // Reset message status to pending
  await supabase
    .from("raw_ingestion_messages")
    .update({
      status: "pending",
      parse_error: null,
      parsed_event_data: null,
      event_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  // Re-process through pipeline
  const rawMsg: RawMessage = {
    external_id: message.external_id,
    content_text: message.content_text,
    content_html: message.content_html,
    image_urls: message.image_urls,
    sender_name: message.sender_name,
    sender_id: message.sender_id,
    raw_data: message.raw_data,
  };

  const result = await processRawMessage(
    id,
    rawMsg,
    message.source_id,
    source?.config || {}
  );

  return NextResponse.json(result);
}
