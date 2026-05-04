"use client";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BlogList } from "@/components/admin/content/blog-list";
import { StoriesList } from "@/components/admin/content/stories-list";
import { NewsletterList } from "@/components/admin/content/newsletter-list";
import type { BlogPost, Story, NewsletterEdition } from "@/types";

interface ContentTabsProps {
  posts: BlogPost[];
  stories: Story[];
  editions: NewsletterEdition[];
}

export function ContentTabs({ posts, stories, editions }: ContentTabsProps) {
  return (
    <Tabs defaultValue="blog">
      <TabsList>
        <TabsTrigger value="blog">
          Blog
          <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">
            {posts.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="stories">
          Stories
          <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">
            {stories.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="newsletter">
          Newsletter
          <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">
            {editions.length}
          </Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="blog">
        <BlogList posts={posts} />
      </TabsContent>

      <TabsContent value="stories">
        <StoriesList stories={stories} />
      </TabsContent>

      <TabsContent value="newsletter">
        <NewsletterList editions={editions} />
      </TabsContent>
    </Tabs>
  );
}
