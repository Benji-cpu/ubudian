import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, FileText, Mail, Users, Clock, Zap } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  type: string;
  icon: string;
  description: string;
  timestamp: string;
  link: string;
}

async function getStats() {
  const supabase = await createClient();

  const [subscribers, events, stories, pending, lastIngestion, pendingIngested] = await Promise.all([
    supabase.from("newsletter_subscribers").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("events").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("stories").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("events").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("raw_ingestion_messages")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
      .not("source_id", "is", null),
  ]);

  const lastMsgTime = lastIngestion.data?.[0]?.created_at ?? null;
  const staleHours = lastMsgTime
    ? (Date.now() - new Date(lastMsgTime).getTime()) / (1000 * 60 * 60)
    : null;

  return {
    subscribers: subscribers.count ?? 0,
    events: events.count ?? 0,
    stories: stories.count ?? 0,
    pending: pending.count ?? 0,
    ingestion: {
      pendingCount: pendingIngested.count ?? 0,
      lastMessageAt: lastMsgTime,
      isStale: staleHours === null || staleHours > 6,
    },
  };
}

async function getRecentActivity(): Promise<ActivityItem[]> {
  const supabase = await createClient();

  const results = await Promise.allSettled([
    supabase
      .from("blog_posts")
      .select("id, title, status, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("stories")
      .select("id, title, status, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("events")
      .select("id, title, status, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("tours")
      .select("id, title, is_active, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("newsletter_editions")
      .select("id, subject, status, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("newsletter_subscribers")
      .select("id, email, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("raw_ingestion_messages")
      .select("id, content_text, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const items: ActivityItem[] = [];

  // Blog posts
  if (results[0].status === "fulfilled" && results[0].value.data) {
    for (const row of results[0].value.data) {
      items.push({
        type: "blog",
        icon: "\u270D\uFE0F",
        description: `Blog post "${row.title}" (${row.status})`,
        timestamp: row.updated_at ?? row.created_at,
        link: `/admin/blog/${row.id}/edit`,
      });
    }
  }

  // Stories
  if (results[1].status === "fulfilled" && results[1].value.data) {
    for (const row of results[1].value.data) {
      items.push({
        type: "story",
        icon: "\uD83D\uDCD6",
        description: `Story "${row.title}" (${row.status})`,
        timestamp: row.updated_at ?? row.created_at,
        link: `/admin/stories/${row.id}/edit`,
      });
    }
  }

  // Events
  if (results[2].status === "fulfilled" && results[2].value.data) {
    for (const row of results[2].value.data) {
      items.push({
        type: "event",
        icon: "\uD83D\uDCC5",
        description: `Event "${row.title}" (${row.status})`,
        timestamp: row.updated_at ?? row.created_at,
        link: `/admin/events/${row.id}/edit`,
      });
    }
  }

  // Tours
  if (results[3].status === "fulfilled" && results[3].value.data) {
    for (const row of results[3].value.data) {
      items.push({
        type: "tour",
        icon: "\uD83E\uDDED",
        description: `Tour "${row.title}" (${row.is_active ? "active" : "inactive"})`,
        timestamp: row.updated_at ?? row.created_at,
        link: `/admin/tours/${row.id}/edit`,
      });
    }
  }

  // Newsletter editions
  if (results[4].status === "fulfilled" && results[4].value.data) {
    for (const row of results[4].value.data) {
      items.push({
        type: "newsletter",
        icon: "\uD83D\uDCE8",
        description: `Newsletter "${row.subject}" (${row.status})`,
        timestamp: row.updated_at ?? row.created_at,
        link: `/admin/newsletter/${row.id}/edit`,
      });
    }
  }

  // Subscribers
  if (results[5].status === "fulfilled" && results[5].value.data) {
    for (const row of results[5].value.data) {
      items.push({
        type: "subscriber",
        icon: "\uD83D\uDC64",
        description: `Subscriber ${row.email} (${row.status})`,
        timestamp: row.created_at,
        link: "/admin/subscribers",
      });
    }
  }

  // Ingestion messages
  if (results[6].status === "fulfilled" && results[6].value.data) {
    for (const row of results[6].value.data) {
      const text = row.content_text ?? "";
      const preview = text.length > 40 ? `${text.slice(0, 40)}…` : text;
      items.push({
        type: "ingestion",
        icon: "⚡",
        description: `Ingestion: "${preview}" (${row.status})`,
        timestamp: row.created_at,
        link: "/admin/ingestion/messages",
      });
    }
  }

  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return items.slice(0, 20);
}

export default async function AdminDashboard() {
  const [stats, activity] = await Promise.all([getStats(), getRecentActivity()]);

  const ingestionSubtitle = stats.ingestion.lastMessageAt
    ? `Last msg: ${formatDistanceToNow(new Date(stats.ingestion.lastMessageAt), { addSuffix: true })}`
    : "No messages yet";

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
    {
      title: "Ingestion Pipeline",
      value: stats.ingestion.pendingCount > 0 ? stats.ingestion.pendingCount : "Healthy",
      icon: Zap,
      href: "/admin/ingestion",
      highlight: stats.ingestion.pendingCount > 0 || stats.ingestion.isStale,
      subtitle: ingestionSubtitle,
      subtitleWarning: stats.ingestion.isStale,
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-1 text-muted-foreground">
        Welcome to The Ubudian admin panel.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
                {stat.subtitle && (
                  <p className={`mt-1 text-xs ${stat.subtitleWarning ? "text-brand-terracotta" : "text-muted-foreground"}`}>
                    {stat.subtitle}
                  </p>
                )}
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
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Activity feed will appear here as you create content.
              </p>
            ) : (
              <div className="space-y-1">
                {activity.map((item, i) => (
                  <Link
                    key={`${item.type}-${item.timestamp}-${i}`}
                    href={item.link}
                    className="flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-muted"
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span className="min-w-0 flex-1 truncate">{item.description}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
