import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, FileText, Mail, Users, Clock } from "lucide-react";
import Link from "next/link";

async function getStats() {
  const supabase = await createClient();

  const [subscribers, events, stories, pending] = await Promise.all([
    supabase.from("newsletter_subscribers").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("events").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("stories").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("events").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  return {
    subscribers: subscribers.count ?? 0,
    events: events.count ?? 0,
    stories: stories.count ?? 0,
    pending: pending.count ?? 0,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const statCards = [
    {
      title: "Newsletter Subscribers",
      value: stats.subscribers,
      icon: Mail,
      href: "/admin/subscribers",
    },
    {
      title: "Published Events",
      value: stats.events,
      icon: Calendar,
      href: "/admin/events",
    },
    {
      title: "Published Stories",
      value: stats.stories,
      icon: Users,
      href: "/admin/stories",
    },
    {
      title: "Pending Events",
      value: stats.pending,
      icon: Clock,
      href: "/admin/events?status=pending",
      highlight: stats.pending > 0,
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-1 text-muted-foreground">
        Welcome to The Ubudian admin panel.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className={`transition-shadow hover:shadow-md ${stat.highlight ? "border-brand-terracotta" : ""}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Activity feed will appear here as you create content.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
