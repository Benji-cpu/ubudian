import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Mail, UserPlus, TrendingUp } from "lucide-react";
import { MobileCardField } from "@/components/admin/mobile-card-field";
import type { NewsletterSubscriber } from "@/types";

export default async function AdminSubscribersPage() {
  const supabase = await createClient();

  const { data: subscribers } = await supabase
    .from("newsletter_subscribers")
    .select("*")
    .order("subscribed_at", { ascending: false });

  const allSubscribers = (subscribers ?? []) as NewsletterSubscriber[];

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const total = allSubscribers.filter((s) => s.status === "active").length;
  const newThisWeek = allSubscribers.filter(
    (s) => s.status === "active" && new Date(s.subscribed_at) >= weekAgo
  ).length;
  const newThisMonth = allSubscribers.filter(
    (s) => s.status === "active" && new Date(s.subscribed_at) >= monthAgo
  ).length;

  return (
    <div>
      <h1 className="text-3xl font-bold">Subscribers</h1>
      <p className="mt-1 text-muted-foreground">
        Manage your newsletter subscribers.
      </p>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Active
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              New This Week
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newThisWeek}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              New This Month
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newThisMonth}</div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriber Table */}
      <div className="mt-8">
        {allSubscribers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Mail className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <p className="mt-4 text-muted-foreground">No subscribers yet.</p>
            </CardContent>
          </Card>
        ) : (
          <>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Instagram</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Subscribed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allSubscribers.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {sub.first_name || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {sub.instagram_handle || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {sub.source}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs font-medium ${
                          sub.status === "active"
                            ? "text-brand-deep-green"
                            : "text-muted-foreground"
                        }`}
                      >
                        {sub.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(sub.subscribed_at), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {allSubscribers.map((sub) => (
              <Card key={sub.id} className="py-3">
                <CardContent className="px-4 py-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{sub.email}</span>
                    <span
                      className={`text-xs font-medium ${
                        sub.status === "active"
                          ? "text-brand-deep-green"
                          : "text-muted-foreground"
                      }`}
                    >
                      {sub.status}
                    </span>
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-2">
                    <MobileCardField label="Name">{sub.first_name || "—"}</MobileCardField>
                    <MobileCardField label="Instagram">{sub.instagram_handle || "—"}</MobileCardField>
                    <MobileCardField label="Source">{sub.source}</MobileCardField>
                    <MobileCardField label="Subscribed">{format(new Date(sub.subscribed_at), "MMM d, yyyy")}</MobileCardField>
                  </dl>
                </CardContent>
              </Card>
            ))}
          </div>
          </>
        )}
      </div>
    </div>
  );
}
