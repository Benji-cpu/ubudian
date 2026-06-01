/**
 * Builds the human-review queue returned to the daily-maintenance agent.
 * Each item is something an agent or admin should consider acting on but
 * isn't safe to auto-resolve.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import type { BrokenLink, LinkHealthReport } from "@/lib/maintenance/cleanups";

export interface FeedbackItem {
  id: string;
  type: string;
  status: string;
  message: string;
  email: string | null;
  page_url: string | null;
  page_title: string | null;
  image_url: string | null;
  pr_url: string | null;
  created_at: string;
}

export interface ReviewQueue {
  feedback: FeedbackItem[];
  dedupBacklog: number;
  unresolvedVenuesLowConfidence: number;
  incompleteSubscriptions: number;
  eventDateInconsistencies: { id: string; title: string; reason: string }[];
  brokenLinks: BrokenLink[];
}

export async function buildReviewQueue(linkHealth?: LinkHealthReport): Promise<ReviewQueue> {
  const supabase = createAdminClient();
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [feedback, dedup, venues, subs, events] = await Promise.all([
    supabase
      .from("feedback")
      .select(
        "id,type,status,message,email,page_url,page_title,image_url,pr_url,created_at",
      )
      .in("status", ["new", "reviewed"])
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("dedup_matches")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .lt("created_at", fourteenDaysAgo),
    supabase
      .from("unresolved_venues")
      .select("id", { count: "exact", head: true })
      .lt("seen_count", 2)
      .lt("last_seen_at", sevenDaysAgo),
    supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "incomplete")
      .lt("created_at", sevenDaysAgo),
    supabase
      .from("events")
      .select("id, title, start_date, end_date, start_time")
      .eq("status", "approved")
      .gte("start_date", new Date().toISOString().split("T")[0])
      .limit(500),
  ]);

  const inconsistencies = (events.data ?? [])
    .map((e) => {
      const reasons: string[] = [];
      if (e.end_date && e.end_date < e.start_date) reasons.push("end_date < start_date");
      // Multi-day, all-day events (festivals, art crawls, markets) legitimately have no
      // single start_time — flagging them is noise that recurs in the digest every day.
      const isMultiDay = !!e.end_date && e.end_date > e.start_date;
      if (!e.start_time && !isMultiDay) reasons.push("missing start_time");
      return reasons.length
        ? { id: e.id, title: e.title, reason: reasons.join("; ") }
        : null;
    })
    .filter((x): x is { id: string; title: string; reason: string } => x !== null)
    .slice(0, 25);

  return {
    feedback: (feedback.data ?? []) as FeedbackItem[],
    dedupBacklog: dedup.count ?? 0,
    unresolvedVenuesLowConfidence: venues.count ?? 0,
    incompleteSubscriptions: subs.count ?? 0,
    eventDateInconsistencies: inconsistencies,
    brokenLinks: linkHealth?.broken ?? [],
  };
}
