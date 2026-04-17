"use client";

import Link from "next/link";
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
import { MessageSquare } from "lucide-react";
import { MobileCardField } from "@/components/admin/mobile-card-field";
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

interface FeedbackListProps {
  feedback: Feedback[];
}

export function FeedbackList({ feedback }: FeedbackListProps) {
  if (feedback.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="flex flex-col items-center py-12">
          <MessageSquare className="h-12 w-12 text-muted-foreground/40" />
          <CardTitle className="mt-4 text-lg">No feedback yet</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Feedback from users will appear here.
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
              <TableHead>Type</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Page</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {feedback.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Badge variant={typeVariant[item.type] ?? "outline"}>
                    {item.type}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[300px]">
                  <Link
                    href={`/admin/feedback/${item.id}`}
                    className="line-clamp-2 text-sm hover:underline"
                  >
                    {item.message}
                  </Link>
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                  {item.page_url ? new URL(item.page_url).pathname : "\u2014"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {item.email ?? "\u2014"}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant[item.status] ?? "outline"}>
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(item.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="mt-4 space-y-3 md:hidden">
        {feedback.map((item) => (
          <Card key={item.id} className="py-3">
            <CardContent className="px-4 py-0">
              <div className="flex items-start justify-between">
                <Badge variant={typeVariant[item.type] ?? "outline"}>
                  {item.type}
                </Badge>
                <Badge variant={statusVariant[item.status] ?? "outline"}>
                  {item.status}
                </Badge>
              </div>
              <Link
                href={`/admin/feedback/${item.id}`}
                className="mt-2 line-clamp-2 block text-sm hover:underline"
              >
                {item.message}
              </Link>
              <dl className="mt-2 grid grid-cols-2 gap-2">
                <MobileCardField label="Page">
                  {item.page_url ? new URL(item.page_url).pathname : "\u2014"}
                </MobileCardField>
                <MobileCardField label="Date">
                  {new Date(item.created_at).toLocaleDateString()}
                </MobileCardField>
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
