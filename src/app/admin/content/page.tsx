import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, FileText, Users, Mail } from "lucide-react";
import { ContentTabs } from "@/components/admin/content/content-tabs";
import type { BlogPost, Story, NewsletterEdition } from "@/types";

export default async function AdminContentPage() {
  const supabase = await createClient();

  const [blogRes, storiesRes, newsletterRes] = await Promise.all([
    supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("stories")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("newsletter_editions")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  const posts = (blogRes.data ?? []) as BlogPost[];
  const stories = (storiesRes.data ?? []) as Story[];
  const editions = (newsletterRes.data ?? []) as NewsletterEdition[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Content</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/admin/blog/new">
                <FileText className="mr-2 h-4 w-4" />
                Blog Post
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/stories/new">
                <Users className="mr-2 h-4 w-4" />
                Story
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/newsletter/new">
                <Mail className="mr-2 h-4 w-4" />
                Newsletter Edition
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-6">
        <ContentTabs posts={posts} stories={stories} editions={editions} />
      </div>
    </div>
  );
}
