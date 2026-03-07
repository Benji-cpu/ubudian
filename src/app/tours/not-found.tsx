import { NotFoundContent } from "@/components/ui/not-found-content";

export default function ToursNotFound() {
  return (
    <NotFoundContent
      title="Tour not found"
      description="This tour doesn't exist or is no longer available."
      backHref="/tours"
      backLabel="Browse all tours"
    />
  );
}
