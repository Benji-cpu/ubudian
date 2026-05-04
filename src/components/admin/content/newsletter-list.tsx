"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
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
import { Plus, Mail } from "lucide-react";
import { MobileCardField } from "@/components/admin/mobile-card-field";
import type { NewsletterEdition } from "@/types";

interface NewsletterListProps {
  editions: NewsletterEdition[];
}

const statusVariant = {
  draft: "secondary" as const,
  published: "default" as const,
  archived: "outline" as const,
};

export function NewsletterList({ editions }: NewsletterListProps) {
  if (editions.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="flex flex-col items-center py-12">
          <Mail className="h-12 w-12 text-muted-foreground/40" />
          <CardTitle className="mt-4 text-lg">No editions yet</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Compose your first newsletter edition.
          </p>
          <Button asChild className="mt-4">
            <Link href="/admin/newsletter/new">
              <Plus className="mr-2 h-4 w-4" />
              New Edition
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-4">
      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {editions.map((edition) => (
          <Card key={edition.id} className="py-3">
            <CardContent className="px-4 py-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/admin/newsletter/${edition.id}/edit`}
                  className="font-medium hover:underline"
                >
                  {edition.subject}
                </Link>
                <Badge variant={statusVariant[edition.status]}>
                  {edition.status}
                </Badge>
              </div>
              <dl className="grid grid-cols-2 gap-2">
                <MobileCardField label="Beehiiv">
                  {edition.beehiiv_post_id ? (
                    <Badge variant="outline" className="text-xs">
                      Synced
                    </Badge>
                  ) : (
                    "\u2014"
                  )}
                </MobileCardField>
                <MobileCardField label="Date">
                  {edition.sent_at
                    ? format(new Date(edition.sent_at), "MMM d, yyyy")
                    : format(new Date(edition.created_at), "MMM d, yyyy")}
                </MobileCardField>
              </dl>
              <div className="flex items-center gap-2 border-t pt-2 mt-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/admin/newsletter/${edition.id}/edit`}>
                    Edit
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Beehiiv</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {editions.map((edition) => (
              <TableRow key={edition.id}>
                <TableCell>
                  <Link
                    href={`/admin/newsletter/${edition.id}/edit`}
                    className="font-medium hover:underline"
                  >
                    {edition.subject}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant[edition.status]}>
                    {edition.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {edition.beehiiv_post_id ? (
                    <Badge variant="outline" className="text-xs">
                      Synced
                    </Badge>
                  ) : (
                    "\u2014"
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {edition.sent_at
                    ? format(new Date(edition.sent_at), "MMM d, yyyy")
                    : format(new Date(edition.created_at), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/admin/newsletter/${edition.id}/edit`}>
                      Edit
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
