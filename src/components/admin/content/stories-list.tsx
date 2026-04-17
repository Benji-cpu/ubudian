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
import { Plus, Users } from "lucide-react";
import { MobileCardField } from "@/components/admin/mobile-card-field";
import { DeleteStoryButton } from "@/app/admin/stories/delete-button";
import type { Story } from "@/types";

const statusVariant = {
  draft: "secondary" as const,
  published: "default" as const,
  archived: "outline" as const,
};

interface StoriesListProps {
  stories: Story[];
}

export function StoriesList({ stories }: StoriesListProps) {
  if (stories.length === 0) {
    return (
      <Card className="mt-4">
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
    );
  }

  return (
    <div className="mt-4">
      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {stories.map((story) => (
          <Card key={story.id} className="py-3">
            <CardContent className="px-4 py-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/admin/stories/${story.id}/edit`}
                  className="font-medium hover:underline"
                >
                  {story.title}
                </Link>
                <Badge variant={statusVariant[story.status]}>
                  {story.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {story.subject_name}
              </p>
              {(story.theme_tags?.length ?? 0) > 0 && (
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
              )}
              <dl className="grid grid-cols-2 gap-2">
                <MobileCardField label="Date">
                  {story.published_at
                    ? format(new Date(story.published_at), "MMM d, yyyy")
                    : format(new Date(story.created_at), "MMM d, yyyy")}
                </MobileCardField>
              </dl>
              <div className="flex items-center gap-2 border-t pt-2 mt-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/admin/stories/${story.id}/edit`}>Edit</Link>
                </Button>
                <DeleteStoryButton
                  storyId={story.id}
                  storyTitle={story.title}
                />
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
              <TableHead>Title</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stories.map((story) => (
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
                    <DeleteStoryButton
                      storyId={story.id}
                      storyTitle={story.title}
                    />
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
