import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { FeedbackStatusActions } from "@/components/admin/feedback/feedback-status-actions";
import type { Feedback } from "@/types";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  new: "default",
  reviewed: "secondary",
  resolved: "outline",
  dismissed: "destructive",
};

const typeVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  bug: "destructive",
  suggestion: "secondary",
  general: "outline",
};

interface FeedbackDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function FeedbackDetailPage({ params }: FeedbackDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("feedback")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) notFound();

  const item = data as Feedback;

  return (
    <div>
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/community">
            <ArrowLeft className="mr-2 h-4 w-4" />
            All Feedback
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold">Feedback</h1>
        <Badge variant={typeVariant[item.type] ?? "outline"}>{item.type}</Badge>
        <Badge variant={statusVariant[item.status] ?? "outline"}>{item.status}</Badge>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Message</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{item.message}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label="Type" value={item.type} />
            <DetailRow label="Email" value={item.email ?? "Anonymous"} />
            <DetailRow label="Page URL" value={item.page_url ?? "—"} />
            <DetailRow label="Page Title" value={item.page_title ?? "—"} />
            <DetailRow label="User Agent" value={item.user_agent ?? "—"} />
            <DetailRow label="Submitted" value={new Date(item.created_at).toLocaleString()} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <FeedbackStatusActions
              feedbackId={item.id}
              currentStatus={item.status}
              adminNotes={item.admin_notes}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[300px] truncate text-right font-medium">{value}</span>
    </div>
  );
}
