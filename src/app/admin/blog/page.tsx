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
import { Plus, FileText } from "lucide-react";
import type { BlogPost } from "@/types";
import { DeletePostButton } from "./delete-button";
import { MobileCardField } from "@/components/admin/mobile-card-field";

export default async function AdminBlogPage() {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });

  const blogPosts = (posts ?? []) as BlogPost[];

  const statusVariant = {
    draft: "secondary" as const,
    published: "default" as const,
    archived: "outline" as const,
  };

  if (blogPosts.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Blog Posts</h1>
          <Button asChild>
            <Link href="/admin/blog/new">
              <Plus className="mr-2 h-4 w-4" />
              New Post
            </Link>
          </Button>
        </div>

        <Card className="mt-8">
          <CardContent className="flex flex-col items-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/40" />
            <CardTitle className="mt-4 text-lg">No blog posts yet</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first blog post to get started.
            </p>
            <Button asChild className="mt-4">
              <Link href="/admin/blog/new">
                <Plus className="mr-2 h-4 w-4" />
                New Post
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
        <h1 className="text-3xl font-bold">Blog Posts</h1>
        <Button asChild>
          <Link href="/admin/blog/new">
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Link>
        </Button>
      </div>

      <div className="mt-6">
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Published</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blogPosts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <Link
                      href={`/admin/blog/${post.id}/edit`}
                      className="font-medium hover:underline"
                    >
                      {post.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[post.status]}>
                      {post.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {post.published_at
                      ? format(new Date(post.published_at), "MMM d, yyyy")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/blog/${post.id}/edit`}>Edit</Link>
                      </Button>
                      <DeletePostButton postId={post.id} postTitle={post.title} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-3 md:hidden">
          {blogPosts.map((post) => (
            <Card key={post.id} className="py-3">
              <CardContent className="px-4 py-0">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/admin/blog/${post.id}/edit`}
                    className="font-medium hover:underline"
                  >
                    {post.title}
                  </Link>
                  <Badge variant={statusVariant[post.status]}>
                    {post.status}
                  </Badge>
                </div>
                <MobileCardField label="Published">
                  {post.published_at
                    ? format(new Date(post.published_at), "MMM d, yyyy")
                    : "—"}
                </MobileCardField>
                <div className="mt-2 flex items-center gap-2 border-t pt-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/admin/blog/${post.id}/edit`}>Edit</Link>
                  </Button>
                  <DeletePostButton postId={post.id} postTitle={post.title} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
