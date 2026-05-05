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
  actioned: "outline",
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
            <DetailRow
              label="Viewport"
              value={
                item.viewport_width && item.viewport_height
                  ? `${item.viewport_width} × ${item.viewport_height}`
                  : "—"
              }
            />
            <DetailRow label="User Agent" value={item.user_agent ?? "—"} />
            <DetailRow label="Submitted" value={new Date(item.created_at).toLocaleString()} />
          </CardContent>
        </Card>

        {item.image_url && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Screenshot</CardTitle>
            </CardHeader>
            <CardContent>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image_url}
                alt="Feedback screenshot"
                className="max-h-[600px] w-auto rounded-md border"
              />
            </CardContent>
          </Card>
        )}

        {item.route_params && Object.keys(item.route_params).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Route Params</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                {JSON.stringify(item.route_params, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {item.activity_trail && item.activity_trail.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Activity Trail</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-1 font-mono text-xs">
                {item.activity_trail.map((evt, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-12 shrink-0 text-muted-foreground">
                      {evt.t.toFixed(1)}s
                    </span>
                    <span className="w-14 shrink-0 uppercase text-muted-foreground">
                      {evt.kind}
                    </span>
                    <span className="break-all">{evt.detail}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}

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
