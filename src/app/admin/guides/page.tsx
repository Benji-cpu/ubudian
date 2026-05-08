import Link from "next/link";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BookOpen, Plus } from "lucide-react";
import type { Guide } from "@/types";

const statusVariant = {
  draft: "secondary" as const,
  published: "default" as const,
  archived: "outline" as const,
};

const tierLabel = {
  practical: "Survival",
  intent: "Intent",
} as const;

export default async function AdminGuidesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("guides")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  const guides = (data ?? []) as Guide[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Guides</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Free, opinionated reading. Practical (Survival Guide) and intent (Why You Came) tiers.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/guides/new">
            <Plus className="mr-2 h-4 w-4" />
            New Guide
          </Link>
        </Button>
      </div>

      <div className="mt-8">
        {guides.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground/40" />
              <CardTitle className="mt-4 text-lg">No guides yet</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first guide.
              </p>
              <Button asChild className="mt-4">
                <Link href="/admin/guides/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Guide
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {guides.map((g) => (
                <Card key={g.id} className="py-3">
                  <CardContent className="px-4 py-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/admin/guides/${g.id}/edit`}
                        className="font-medium hover:underline"
                      >
                        {g.title}
                      </Link>
                      <Badge variant={statusVariant[g.status]}>{g.status}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="text-xs">
                        {tierLabel[g.tier]}
                      </Badge>
                      {g.is_editors_pick && (
                        <Badge className="text-xs">Editor&apos;s pick</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {g.published_at
                        ? format(new Date(g.published_at), "MMM d, yyyy")
                        : format(new Date(g.created_at), "MMM d, yyyy")}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Intent tags</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {guides.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell>
                        <Link
                          href={`/admin/guides/${g.id}/edit`}
                          className="font-medium hover:underline"
                        >
                          {g.title}
                        </Link>
                        {g.is_editors_pick && (
                          <Badge className="ml-2 text-xs">Editor&apos;s pick</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {tierLabel[g.tier]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {g.intent_tags.slice(0, 3).map((t) => (
                            <Badge key={t} variant="outline" className="text-xs">
                              {t}
                            </Badge>
                          ))}
                          {g.intent_tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{g.intent_tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[g.status]}>{g.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {g.published_at
                          ? format(new Date(g.published_at), "MMM d, yyyy")
                          : format(new Date(g.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/guides/${g.id}/edit`}>Edit</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
