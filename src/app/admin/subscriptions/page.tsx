import { createClient } from "@/lib/supabase/server";
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
import type { Subscription } from "@/types";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  trialing: "default",
  past_due: "destructive",
  canceled: "secondary",
  unpaid: "destructive",
  incomplete: "outline",
};

export default async function AdminSubscriptionsPage() {
  const supabase = await createClient();

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("*, profiles(display_name, email)")
    .order("created_at", { ascending: false });

  const allSubs = (subscriptions ?? []) as (Subscription & { profiles: { display_name: string | null; email: string | null } })[];

  if (allSubs.length === 0) {
    return (
      <div>
        <h1 className="text-3xl font-bold">Subscriptions</h1>
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center py-12">
            <Sparkles className="h-12 w-12 text-muted-foreground/40" />
            <CardTitle className="mt-4 text-lg">No subscriptions yet</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Subscriptions will appear here once members sign up.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Subscriptions</h1>

      <div className="mt-6">
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
            {allSubs.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell>
                  <div>
                    <div className="text-sm font-medium">{sub.profiles?.display_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{sub.profiles?.email ?? "—"}</div>
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
                    : "—"}
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
    </div>
  );
}
