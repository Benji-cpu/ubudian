import { NotFoundContent } from "@/components/ui/not-found-content";

export default function BlogNotFound() {
  return (
    <NotFoundContent
      title="Post not found"
      description="This blog post doesn't exist or has been removed."
      backHref="/blog"
      backLabel="Browse all posts"
    />
  );
}
