import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BlogForm } from "@/components/admin/blog-form";
import type { BlogPost } from "@/types";

interface EditBlogPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBlogPostPage({ params }: EditBlogPostPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (!post) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Edit Post</h1>
      <p className="mt-1 text-muted-foreground">
        Update your blog post.
      </p>
      <div className="mt-8">
        <BlogForm initialData={post as BlogPost} />
      </div>
    </div>
  );
}
