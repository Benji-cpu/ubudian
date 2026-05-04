"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type { FeedbackStatus } from "@/types";

const STATUS_ACTIONS: { label: string; value: FeedbackStatus; variant: "default" | "secondary" | "destructive" | "outline" }[] = [
  { label: "Mark Reviewed", value: "reviewed", variant: "secondary" },
  { label: "Mark Resolved", value: "resolved", variant: "default" },
  { label: "Dismiss", value: "dismissed", variant: "destructive" },
];

interface FeedbackStatusActionsProps {
  feedbackId: string;
  currentStatus: FeedbackStatus;
  adminNotes: string | null;
}

export function FeedbackStatusActions({ feedbackId, currentStatus, adminNotes }: FeedbackStatusActionsProps) {
  const router = useRouter();
  const [notes, setNotes] = useState(adminNotes ?? "");
  const [loading, setLoading] = useState<string | null>(null);

  async function updateStatus(status: FeedbackStatus) {
    setLoading(status);
    try {
      const res = await fetch(`/api/admin/feedback/${feedbackId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, admin_notes: notes || null }),
      });

      if (!res.ok) {
        const result = await res.json();
        toast.error(result.error || "Failed to update");
        return;
      }

      toast.success(`Status updated to ${status}`);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  async function saveNotes() {
    setLoading("notes");
    try {
      const res = await fetch(`/api/admin/feedback/${feedbackId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_notes: notes || null }),
      });

      if (!res.ok) {
        const result = await res.json();
        toast.error(result.error || "Failed to save notes");
        return;
      }

      toast.success("Notes saved");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="admin-notes">Admin Notes</Label>
        <Textarea
          id="admin-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Internal notes about this feedback..."
          className="mt-1"
        />
        <Button
          onClick={saveNotes}
          variant="outline"
          size="sm"
          className="mt-2"
          disabled={loading === "notes"}
        >
          {loading === "notes" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Save Notes
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_ACTIONS.filter((a) => a.value !== currentStatus).map((action) => (
          <Button
            key={action.value}
            onClick={() => updateStatus(action.value)}
            variant={action.variant}
            size="sm"
            disabled={loading !== null}
          >
            {loading === action.value ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
