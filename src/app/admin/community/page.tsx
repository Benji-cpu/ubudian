import { createClient } from "@/lib/supabase/server";
import { CommunityTabs } from "@/components/admin/community/community-tabs";
import type { NewsletterSubscriber, TrustedSubmitter, Feedback } from "@/types";

export default async function AdminCommunityPage() {
  const supabase = await createClient();

  const [subscribersRes, submittersRes, feedbackRes] = await Promise.all([
    supabase
      .from("newsletter_subscribers")
      .select("*")
      .order("subscribed_at", { ascending: false }),
    supabase
      .from("trusted_submitters")
      .select("*")
      .order("approved_count", { ascending: false }),
    supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  const subscribers = (subscribersRes.data ?? []) as NewsletterSubscriber[];
  const submitters = (submittersRes.data ?? []) as TrustedSubmitter[];
  const feedback = (feedbackRes.data ?? []) as Feedback[];

  // Subscriber stats
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const subscriberStats = {
    total: subscribers.filter((s) => s.status === "active").length,
    newThisWeek: subscribers.filter(
      (s) => s.status === "active" && new Date(s.subscribed_at) >= weekAgo
    ).length,
    newThisMonth: subscribers.filter(
      (s) => s.status === "active" && new Date(s.subscribed_at) >= monthAgo
    ).length,
  };

  // Trusted submitter stats
  const submitterStats = {
    total: submitters.length,
    autoApproveCount: submitters.filter((s) => s.auto_approve).length,
    totalApprovals: submitters.reduce((sum, s) => sum + s.approved_count, 0),
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">Community</h1>
      <p className="mt-1 text-muted-foreground">
        Manage subscribers, trusted submitters, and user feedback.
      </p>

      <div className="mt-6">
        <CommunityTabs
          subscribers={subscribers}
          subscriberStats={subscriberStats}
          submitters={submitters}
          submitterStats={submitterStats}
          feedback={feedback}
        />
      </div>
    </div>
  );
}
