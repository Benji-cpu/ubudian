import Link from "next/link";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
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
import type { NewsletterEdition } from "@/types";

export default async function AdminNewsletterPage() {
  const supabase = await createClient();

  const { data: editions } = await supabase
    .from("newsletter_editions")
    .select("*")
    .order("created_at", { ascending: false });

  const allEditions = (editions ?? []) as NewsletterEdition[];

  const statusVariant = {
    draft: "secondary" as const,
    published: "default" as const,
    archived: "outline" as const,
  };

  if (allEditions.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Newsletter</h1>
          <Button asChild>
            <Link href="/admin/newsletter/new">
              <Plus className="mr-2 h-4 w-4" />
              New Edition
            </Link>
          </Button>
        </div>
        <Card className="mt-8">
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
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Newsletter</h1>
        <Button asChild>
          <Link href="/admin/newsletter/new">
            <Plus className="mr-2 h-4 w-4" />
            New Edition
          </Link>
        </Button>
      </div>

      <div className="mt-6">
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
            {allEditions.map((edition) => (
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
                    <Badge variant="outline" className="text-xs">Synced</Badge>
                  ) : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {edition.sent_at
                    ? format(new Date(edition.sent_at), "MMM d, yyyy")
                    : format(new Date(edition.created_at), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/admin/newsletter/${edition.id}/edit`}>Edit</Link>
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
