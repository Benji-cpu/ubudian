"use client";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubscribersList } from "@/components/admin/community/subscribers-list";
import { TrustedSubmittersList } from "@/components/admin/community/trusted-submitters-list";
import { FeedbackList } from "@/components/admin/community/feedback-list";
import type { NewsletterSubscriber, TrustedSubmitter, Feedback } from "@/types";

interface SubscriberStats {
  total: number;
  newThisWeek: number;
  newThisMonth: number;
}

interface TrustedSubmitterStats {
  total: number;
  autoApproveCount: number;
  totalApprovals: number;
}

interface CommunityTabsProps {
  subscribers: NewsletterSubscriber[];
  subscriberStats: SubscriberStats;
  submitters: TrustedSubmitter[];
  submitterStats: TrustedSubmitterStats;
  feedback: Feedback[];
}

export function CommunityTabs({
  subscribers,
  subscriberStats,
  submitters,
  submitterStats,
  feedback,
}: CommunityTabsProps) {
  return (
    <Tabs defaultValue="subscribers">
      <TabsList>
        <TabsTrigger value="subscribers">
          Subscribers
          <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">
            {subscribers.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="trusted">
          Trusted
          <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">
            {submitters.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="feedback">
          Feedback
          <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">
            {feedback.length}
          </Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="subscribers">
        <SubscribersList subscribers={subscribers} stats={subscriberStats} />
      </TabsContent>

      <TabsContent value="trusted">
        <TrustedSubmittersList submitters={submitters} stats={submitterStats} />
      </TabsContent>

      <TabsContent value="feedback">
        <FeedbackList feedback={feedback} />
      </TabsContent>
    </Tabs>
  );
}
