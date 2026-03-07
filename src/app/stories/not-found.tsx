import { NotFoundContent } from "@/components/ui/not-found-content";

export default function StoriesNotFound() {
  return (
    <NotFoundContent
      title="Story not found"
      description="This story doesn't exist or has been removed."
      backHref="/stories"
      backLabel="Browse all stories"
    />
  );
}
