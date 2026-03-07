import { BlogForm } from "@/components/admin/blog-form";

export default function NewBlogPostPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">New Blog Post</h1>
      <p className="mt-1 text-muted-foreground">
        Create a new blog post for The Ubudian.
      </p>
      <div className="mt-8">
        <BlogForm />
      </div>
    </div>
  );
}
