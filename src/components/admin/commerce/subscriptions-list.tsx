"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Sparkles } from "lucide-react";
import { MobileCardField } from "@/components/admin/mobile-card-field";
import type { Subscription } from "@/types";

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  trialing: "default",
  past_due: "destructive",
  canceled: "secondary",
  unpaid: "destructive",
  incomplete: "outline",
};

export type SubscriptionWithProfile = Subscription & {
  profiles: { display_name: string | null; email: string | null };
};

interface SubscriptionsListProps {
  subscriptions: SubscriptionWithProfile[];
}

export function SubscriptionsList({ subscriptions }: SubscriptionsListProps) {
  if (subscriptions.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="flex flex-col items-center py-12">
          <Sparkles className="h-12 w-12 text-muted-foreground/40" />
          <CardTitle className="mt-4 text-lg">No subscriptions yet</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Subscriptions will appear here once members sign up.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-4">
      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Interval</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Period End</TableHead>
              <TableHead>Auto-Renew</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell>
                  <div>
                    <div className="text-sm font-medium">
                      {sub.profiles?.display_name ?? "\u2014"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {sub.profiles?.email ?? "\u2014"}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{sub.plan_name}</TableCell>
                <TableCell className="capitalize">{sub.interval}ly</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[sub.status] ?? "outline"}>
                    {sub.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {sub.current_period_end
                    ? new Date(sub.current_period_end).toLocaleDateString()
                    : "\u2014"}
                </TableCell>
                <TableCell>
                  {sub.cancel_at_period_end ? (
                    <Badge variant="secondary">Cancelling</Badge>
                  ) : (
                    <Badge variant="outline">Active</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {subscriptions.map((sub) => (
          <Card key={sub.id} className="py-3">
            <CardContent className="px-4 py-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {sub.profiles?.display_name ?? "\u2014"}
                </span>
                <Badge variant={statusVariant[sub.status] ?? "outline"}>
                  {sub.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {sub.profiles?.email ?? "\u2014"}
              </p>
              <dl className="mt-2 grid grid-cols-2 gap-2">
                <MobileCardField label="Plan">{sub.plan_name}</MobileCardField>
                <MobileCardField label="Interval">
                  <span className="capitalize">{sub.interval}ly</span>
                </MobileCardField>
                <MobileCardField label="Period End">
                  {sub.current_period_end
                    ? new Date(sub.current_period_end).toLocaleDateString()
                    : "\u2014"}
                </MobileCardField>
                <MobileCardField label="Auto-Renew">
                  {sub.cancel_at_period_end ? (
                    <Badge variant="secondary">Cancelling</Badge>
                  ) : (
                    <Badge variant="outline">Active</Badge>
                  )}
                </MobileCardField>
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
