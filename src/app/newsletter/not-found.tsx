import { NotFoundContent } from "@/components/ui/not-found-content";

export default function NewsletterNotFound() {
  return (
    <NotFoundContent
      title="Edition not found"
      description="This newsletter edition doesn't exist or has been removed."
      backHref="/newsletter"
      backLabel="Browse all editions"
    />
  );
}
