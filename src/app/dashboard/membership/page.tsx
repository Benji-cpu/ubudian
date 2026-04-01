import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { getActiveSubscription } from "@/lib/stripe/subscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BillingButton } from "@/components/membership/billing-button";
import { MemberBadge } from "@/components/membership/member-badge";
import { CheckCircle, Sparkles } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Membership | The Ubudian",
};

export default async function DashboardMembershipPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const subscription = await getActiveSubscription(profile.id);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Membership</h1>

      {subscription ? (
        <Card className="border-brand-gold/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CardTitle className="font-serif text-xl">{subscription.plan_name}</CardTitle>
              <MemberBadge />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
                  {subscription.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Billing</span>
                <span className="font-medium capitalize">{subscription.interval}ly</span>
              </div>
              {subscription.current_period_end && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {subscription.cancel_at_period_end ? "Expires" : "Next billing"}
                  </span>
                  <span className="font-medium">
                    {new Date(subscription.current_period_end).toLocaleDateString()}
                  </span>
                </div>
              )}
              {subscription.cancel_at_period_end && (
                <p className="text-sm text-amber-600">
                  Your subscription will not renew after the current period.
                </p>
              )}
            </div>
            <BillingButton />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Sparkles className="h-12 w-12 text-brand-gold/60" />
            <h2 className="mt-4 font-serif text-xl font-medium">
              You&apos;re part of the community
            </h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Go deeper with Ubudian Insider — members-only stories, early tour access, and the content nobody else sees.
            </p>
            <div className="mt-4 space-y-2 text-left text-sm">
              {["First access to new tours", "Members-only stories & deep dives", "Tour discounts", "Insider badge on your profile"].map((perk) => (
                <div key={perk} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-brand-gold" />
                  {perk}
                </div>
              ))}
            </div>
            <Button asChild className="mt-6">
              <Link href="/membership">View Plans</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
