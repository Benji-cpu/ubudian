import Link from "next/link";
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
import { Plus, MapPin } from "lucide-react";
import type { Tour } from "@/types";
import { DeleteTourButton } from "./delete-button";

export default async function AdminToursPage() {
  const supabase = await createClient();

  const { data: tours } = await supabase
    .from("tours")
    .select("*")
    .order("created_at", { ascending: false });

  const allTours = (tours ?? []) as Tour[];

  if (allTours.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Tours</h1>
          <Button asChild>
            <Link href="/admin/tours/new">
              <Plus className="mr-2 h-4 w-4" />
              New Tour
            </Link>
          </Button>
        </div>
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground/40" />
            <CardTitle className="mt-4 text-lg">No tours yet</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first tour experience.
            </p>
            <Button asChild className="mt-4">
              <Link href="/admin/tours/new">
                <Plus className="mr-2 h-4 w-4" />
                New Tour
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
        <h1 className="text-3xl font-bold">Tours</h1>
        <Button asChild>
          <Link href="/admin/tours/new">
            <Plus className="mr-2 h-4 w-4" />
            New Tour
          </Link>
        </Button>
      </div>

      <div className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Theme</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allTours.map((tour) => (
              <TableRow key={tour.id}>
                <TableCell>
                  <Link
                    href={`/admin/tours/${tour.id}/edit`}
                    className="font-medium hover:underline"
                  >
                    {tour.title}
                  </Link>
                </TableCell>
                <TableCell>
                  {tour.theme ? (
                    <Badge variant="outline" className="text-xs">{tour.theme}</Badge>
                  ) : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {tour.duration || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {tour.price_per_person
                    ? `${tour.price_per_person.toLocaleString()} IDR`
                    : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={tour.is_active ? "default" : "secondary"}>
                    {tour.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/tours/${tour.id}/edit`}>Edit</Link>
                    </Button>
                    <DeleteTourButton tourId={tour.id} tourTitle={tour.title} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
