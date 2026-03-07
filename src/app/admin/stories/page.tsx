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
import { Plus, Users } from "lucide-react";
import type { Story } from "@/types";
import { DeleteStoryButton } from "./delete-button";

export default async function AdminStoriesPage() {
  const supabase = await createClient();

  const { data: stories } = await supabase
    .from("stories")
    .select("*")
    .order("created_at", { ascending: false });

  const allStories = (stories ?? []) as Story[];

  const statusVariant = {
    draft: "secondary" as const,
    published: "default" as const,
    archived: "outline" as const,
  };

  if (allStories.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Stories</h1>
          <Button asChild>
            <Link href="/admin/stories/new">
              <Plus className="mr-2 h-4 w-4" />
              New Story
            </Link>
          </Button>
        </div>
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center py-12">
            <Users className="h-12 w-12 text-muted-foreground/40" />
            <CardTitle className="mt-4 text-lg">No stories yet</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first Humans of Ubud story.
            </p>
            <Button asChild className="mt-4">
              <Link href="/admin/stories/new">
                <Plus className="mr-2 h-4 w-4" />
                New Story
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
        <h1 className="text-3xl font-bold">Stories</h1>
        <Button asChild>
          <Link href="/admin/stories/new">
            <Plus className="mr-2 h-4 w-4" />
            New Story
          </Link>
        </Button>
      </div>

      <div className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allStories.map((story) => (
              <TableRow key={story.id}>
                <TableCell>
                  <Link
                    href={`/admin/stories/${story.id}/edit`}
                    className="font-medium hover:underline"
                  >
                    {story.title}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {story.subject_name}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {story.theme_tags?.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {(story.theme_tags?.length ?? 0) > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{story.theme_tags.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant[story.status]}>
                    {story.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {story.published_at
                    ? format(new Date(story.published_at), "MMM d, yyyy")
                    : format(new Date(story.created_at), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/stories/${story.id}/edit`}>Edit</Link>
                    </Button>
                    <DeleteStoryButton storyId={story.id} storyTitle={story.title} />
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
