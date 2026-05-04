import { createAdminClient } from "@/lib/supabase/admin";
import type { ActivityCategory, ActivitySeverity } from "@/types";

interface LogActivityParams {
  category: ActivityCategory;
  severity?: ActivitySeverity;
  title: string;
  details?: Record<string, unknown>;
  sourceId?: string;
}

/**
 * Log an activity entry to the ingestion_activity_log table.
 * Fire-and-forget — never throws, never blocks the pipeline.
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("ingestion_activity_log").insert({
      category: params.category,
      severity: params.severity ?? "info",
      title: params.title,
      details: params.details ?? null,
      source_id: params.sourceId ?? null,
    });
  } catch (err) {
    console.error("[activity-log] Failed to log activity:", err);
  }
}
