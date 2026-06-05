import { createClient } from "@/lib/supabase/server";
import { AudienceSection } from "@/components/admin/analytics/audience-section";
import { EngagementSection } from "@/components/admin/analytics/engagement-section";
import { RevenueSection } from "@/components/admin/analytics/revenue-section";
import { GrowthSection } from "@/components/admin/analytics/growth-section";
import type { BarListItem } from "@/components/admin/analytics/bar-list";
import { estimateMrrCents } from "@/lib/analytics/mrr";
import { formatDistanceToNow } from "date-fns";

export const revalidate = 60;

const n = (v: unknown): number => Number(v ?? 0) || 0;

type DayRow = { day: string; count: number | string };
type SavedRow = { entity_id: string; title: string; slug: string; saves: number | string };
type NamedCount = { archetype?: string; source?: string; count: number | string };

export default async function AdminAnalytics() {
  const supabase = await createClient();
  const now = new Date();
  const iso30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    accountsTotalRes,
    onboardingRes,
    newSignups30dRes,
    quizTotalRes,
    quizWithProfileRes,
    newsletterTotalRes,
    loginStatsRes,
    revenueRes,
    accountsSeriesRes,
    newsletterSeriesRes,
    topEventsRes,
    topJourneysRes,
    topGuidesRes,
    archetypesRes,
    signupSourcesRes,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .not("welcomed_at", "is", null),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", iso30),
    supabase.from("quiz_results").select("id", { count: "exact", head: true }),
    supabase
      .from("quiz_results")
      .select("id", { count: "exact", head: true })
      .not("profile_id", "is", null),
    supabase
      .from("newsletter_subscribers")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase.rpc("analytics_login_stats"),
    supabase.rpc("analytics_revenue_summary"),
    supabase.rpc("analytics_accounts_per_day", { days: 30 }),
    supabase.rpc("analytics_newsletter_per_day", { days: 90 }),
    supabase.rpc("analytics_top_saved_events", { lim: 8 }),
    supabase.rpc("analytics_top_saved_journeys", { lim: 8 }),
    supabase.rpc("analytics_top_saved_guides", { lim: 8 }),
    supabase.rpc("analytics_archetype_distribution"),
    supabase.rpc("analytics_signups_by_source"),
  ]);

  // --- Audience ---
  const totalAccounts = accountsTotalRes.count ?? 0;
  const onboardingCompleted = onboardingRes.count ?? 0;
  const newSignups30d = newSignups30dRes.count ?? 0;
  const loginStats = (loginStatsRes.data?.[0] ?? {}) as Partial<{
    active_1d: number;
    active_7d: number;
    active_30d: number;
    never_signed_in: number;
  }>;
  const login = {
    active_1d: n(loginStats.active_1d),
    active_7d: n(loginStats.active_7d),
    active_30d: n(loginStats.active_30d),
    never_signed_in: n(loginStats.never_signed_in),
  };
  const accountsSeries = ((accountsSeriesRes.data ?? []) as DayRow[]).map((r) =>
    n(r.count)
  );

  // --- Revenue ---
  const rev = (revenueRes.data?.[0] ?? {}) as Partial<{
    active_subs_monthly: number;
    active_subs_yearly: number;
    bookings_realized: number;
    payments_succeeded: number;
    revenue_collected_cents: number;
  }>;
  const monthly = n(rev.active_subs_monthly);
  const yearly = n(rev.active_subs_yearly);
  const activeMembers = monthly + yearly;
  const mrrCents = estimateMrrCents({ monthly, yearly });

  // --- Engagement ---
  const toBarItems = (rows: SavedRow[], base: string): BarListItem[] =>
    rows.map((r) => ({
      label: r.title,
      value: n(r.saves),
      href: `${base}/${r.slug}`,
    }));
  const topEvents = toBarItems((topEventsRes.data ?? []) as SavedRow[], "/events");
  const topJourneys = toBarItems(
    (topJourneysRes.data ?? []) as SavedRow[],
    "/experiences"
  );
  const topGuides = toBarItems((topGuidesRes.data ?? []) as SavedRow[], "/guides");
  const archetypes = ((archetypesRes.data ?? []) as NamedCount[]).map((r) => ({
    label: r.archetype ?? "Unset",
    value: n(r.count),
  }));

  // --- Growth ---
  const newsletterTotal = newsletterTotalRes.count ?? 0;
  const newsletterSeries = ((newsletterSeriesRes.data ?? []) as DayRow[]).map(
    (r) => n(r.count)
  );
  const signupsBySource = ((signupSourcesRes.data ?? []) as NamedCount[]).map(
    (r) => ({ label: r.source ?? "unknown", value: n(r.count) })
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Audience, engagement, revenue and growth at a glance
          </p>
        </div>
        <span className="text-xs text-muted-foreground">
          Updated {formatDistanceToNow(now, { addSuffix: true })}
        </span>
      </div>

      <AudienceSection
        totalAccounts={totalAccounts}
        activeMembers={activeMembers}
        logins7d={login.active_7d}
        newSignups30d={newSignups30d}
        onboardingCompleted={onboardingCompleted}
        accountsSeries={accountsSeries}
        loginStats={login}
      />

      <EngagementSection
        topEvents={topEvents}
        topJourneys={topJourneys}
        topGuides={topGuides}
        quizTotal={quizTotalRes.count ?? 0}
        quizWithProfile={quizWithProfileRes.count ?? 0}
        archetypes={archetypes}
      />

      <RevenueSection
        activeMembers={activeMembers}
        mrrCents={mrrCents}
        bookingsRealized={n(rev.bookings_realized)}
        revenueCollectedCents={n(rev.revenue_collected_cents)}
        paymentsSucceeded={n(rev.payments_succeeded)}
        totalAccounts={totalAccounts}
      />

      <GrowthSection
        newsletterTotal={newsletterTotal}
        newsletterSeries={newsletterSeries}
        signupsBySource={signupsBySource}
      />

      <p className="border-t pt-4 text-xs text-muted-foreground">
        First-party metrics over data we already store. Anonymous traffic
        (unique visitors, page views, referrers, devices) lives in the Vercel
        Analytics dashboard. Per-event click tracking arrives with Phase 2.
      </p>
    </div>
  );
}
