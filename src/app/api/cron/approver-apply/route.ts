/**
 * POST /api/cron/approver-apply
 *
 * Second leg of the git-as-bus pattern for the daily event approver.
 *
 * GH Actions workflow `.github/workflows/approver-apply.yml` triggers on
 * any push to `curator/approvals/decisions/**` (committed by the Claude
 * trigger), reads the decisions JSON, and POSTs it here. This route
 * applies the status UPDATEs to the events table.
 *
 * Body shape:
 *   {
 *     date: "YYYY-MM-DD",
 *     decisions: Array<{
 *       id: string,
 *       action: "approve" | "archive_off_topic" | "archive_dup" | "escalate",
 *       reason?: string,                          // one-line, stored on the row
 *       dup_of?: string                           // for archive_dup, the approved sibling id
 *     }>
 *   }
 *
 * `escalate` decisions are no-ops in the DB — the row stays pending. They
 * exist only so the audit log can carry them; the route silently skips them
 * but returns a count.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/ingestion/activity-log";

export const runtime = "nodejs";
export const maxDuration = 60;

type RepairPatch = {
  start_time?: string | null;
  end_time?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  venue_name?: string | null;
  venue_address?: string | null;
  description?: string | null;
  short_description?: string | null;
  external_ticket_url?: string | null;
  organizer_name?: string | null;
  organizer_instagram?: string | null;
};

type Decision = {
  id: string;
  action: "approve" | "archive_off_topic" | "archive_dup" | "escalate" | "repair";
  reason?: string;
  dup_of?: string;
  /** Required when action === "repair". Only the listed fields are updated. */
  patch?: RepairPatch;
};

const REPAIRABLE_FIELDS: Array<keyof RepairPatch> = [
  "start_time",
  "end_time",
  "start_date",
  "end_date",
  "venue_name",
  "venue_address",
  "description",
  "short_description",
  "external_ticket_url",
  "organizer_name",
  "organizer_instagram",
];

function sanitisePatch(patch: RepairPatch | undefined): Partial<RepairPatch> {
  const out: Partial<RepairPatch> = {};
  if (!patch) return out;
  for (const field of REPAIRABLE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(patch, field)) {
      out[field] = patch[field];
    }
  }
  return out;
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { date?: string; decisions?: Decision[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const date = body.date;
  const decisions = body.decisions;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Missing or invalid 'date' (YYYY-MM-DD)" }, { status: 400 });
  }
  if (!Array.isArray(decisions)) {
    return NextResponse.json({ error: "Missing 'decisions' array" }, { status: 400 });
  }
  if (decisions.length === 0) {
    return NextResponse.json({ date, applied: 0, approved: 0, archived: 0, escalated: 0, skipped: "empty" });
  }

  const supabase = createAdminClient();

  let approved = 0;
  let archivedOffTopic = 0;
  let archivedDup = 0;
  let escalated = 0;
  let repaired = 0;
  let skipped = 0;
  const errors: Array<{ id: string; error: string }> = [];

  const now = new Date().toISOString();

  for (const d of decisions) {
    if (!d?.id || !d?.action) {
      skipped++;
      errors.push({ id: d?.id ?? "unknown", error: "missing id or action" });
      continue;
    }

    try {
      if (d.action === "approve") {
        const { error } = await supabase
          .from("events")
          .update({
            status: "approved",
            ai_approved_at: now,
            moderation_reason: d.reason ? `approver_ok: ${d.reason}` : null,
            updated_at: now,
          })
          .eq("id", d.id)
          .eq("status", "pending");
        if (error) throw error;
        approved++;
      } else if (d.action === "archive_off_topic") {
        const { error } = await supabase
          .from("events")
          .update({
            status: "archived",
            moderation_reason: `ai_approver_off_topic_${date}${d.reason ? `: ${d.reason}` : ""}`,
            updated_at: now,
          })
          .eq("id", d.id)
          .eq("status", "pending");
        if (error) throw error;
        archivedOffTopic++;
      } else if (d.action === "archive_dup") {
        const reasonSuffix = d.dup_of
          ? `: dup_of=${d.dup_of}${d.reason ? ` (${d.reason})` : ""}`
          : d.reason
            ? `: ${d.reason}`
            : "";
        const { error } = await supabase
          .from("events")
          .update({
            status: "archived",
            moderation_reason: `ai_approver_dup_${date}${reasonSuffix}`,
            updated_at: now,
          })
          .eq("id", d.id)
          .eq("status", "pending");
        if (error) throw error;
        archivedDup++;
      } else if (d.action === "escalate") {
        // Leave status='pending'. Record reason for visibility.
        if (d.reason) {
          const { error } = await supabase
            .from("events")
            .update({
              moderation_reason: `ai_approver_escalated_${date}: ${d.reason}`,
              updated_at: now,
            })
            .eq("id", d.id)
            .eq("status", "pending");
          if (error) throw error;
        }
        escalated++;
      } else if (d.action === "repair") {
        // Patch listed fields without changing status. Often paired with an
        // approve decision in the same payload — the approver typically
        // emits a `repair` first then a separate `approve` for the same id
        // so the apply route lands them in order.
        const patch = sanitisePatch(d.patch);
        if (Object.keys(patch).length === 0) {
          skipped++;
          errors.push({ id: d.id, error: "repair with empty/invalid patch" });
        } else {
          const { error } = await supabase
            .from("events")
            .update({
              ...patch,
              moderation_reason: `ai_approver_repaired_${date}${d.reason ? `: ${d.reason}` : ""}`,
              updated_at: now,
            })
            .eq("id", d.id);
          if (error) throw error;
          repaired++;
        }
      } else {
        skipped++;
        errors.push({ id: d.id, error: `unknown action: ${d.action}` });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      errors.push({ id: d.id, error: message });
      skipped++;
    }
  }

  await logActivity({
    category: "run_summary",
    title: `Approver: applied ${approved + archivedOffTopic + archivedDup + repaired} decisions, ${escalated} escalated (${date})`,
    details: {
      date,
      approved,
      archived_off_topic: archivedOffTopic,
      archived_dup: archivedDup,
      repaired,
      escalated,
      skipped,
      decisions_total: decisions.length,
      errors: errors.slice(0, 20),
    },
  });

  return NextResponse.json({
    date,
    applied: approved + archivedOffTopic + archivedDup + repaired,
    approved,
    archived_off_topic: archivedOffTopic,
    archived_dup: archivedDup,
    repaired,
    escalated,
    skipped,
    errors: errors.slice(0, 20),
  });
}
