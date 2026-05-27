/**
 * GET /api/admin/activity-feed
 *
 * Cross-app activity feed for the Freelance ops hub.
 * Returns recent feedback + signups for aggregation in /admin/apps.
 *
 * Auth: Authorization: Bearer ${CRON_SECRET}
 * Query: ?since=<iso>&limit=20
 */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");
  const expected = process.env.CRON_SECRET;
  if (!expected || (authHeader !== `Bearer ${expected}` && querySecret !== expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20"), 100);
  const sinceParam = url.searchParams.get("since");
  const since = sinceParam
    ? new Date(sinceParam).toISOString()
    : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const admin = createAdminClient();

  const { data: feedbackRows, error: fbErr } = await admin
    .from("feedback")
    .select("id, message, status, page_url, email, profile_id, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(limit);

  const { data: signupRows, error: signErr } = await admin
    .from("profiles")
    .select("id, email, display_name, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(limit);

  const { count: feedbackTotal } = await admin
    .from("feedback")
    .select("*", { count: "exact", head: true });

  const { count: feedbackNew } = await admin
    .from("feedback")
    .select("*", { count: "exact", head: true })
    .eq("status", "new");

  const { count: signupsTotal } = await admin
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { count: signups24h } = await admin
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", dayAgo);

  // Resolve emails for feedback rows missing the email column
  const profileIds = (feedbackRows ?? [])
    .filter((r) => !r.email && r.profile_id)
    .map((r) => r.profile_id);
  let emailByProfile: Record<string, { email: string | null; name: string | null }> = {};
  if (profileIds.length) {
    const { data: profs } = await admin
      .from("profiles")
      .select("id, email, display_name")
      .in("id", profileIds);
    emailByProfile = Object.fromEntries(
      (profs ?? []).map((p) => [p.id, { email: p.email, name: p.display_name }]),
    );
  }

  return NextResponse.json({
    app: "ubudian",
    feedback: (feedbackRows ?? []).map((f) => ({
      id: f.id,
      message: f.message,
      status: f.status,
      page_url: f.page_url,
      user_email: f.email ?? emailByProfile[f.profile_id ?? ""]?.email ?? null,
      user_name: emailByProfile[f.profile_id ?? ""]?.name ?? null,
      created_at: f.created_at,
    })),
    signups: (signupRows ?? []).map((u) => ({
      id: u.id,
      email: u.email,
      name: u.display_name,
      created_at: u.created_at,
    })),
    counts: {
      feedback_total: feedbackTotal ?? 0,
      feedback_new: feedbackNew ?? 0,
      signups_total: signupsTotal ?? 0,
      signups_24h: signups24h ?? 0,
    },
    errors: [fbErr?.message, signErr?.message].filter(Boolean),
  });
}
