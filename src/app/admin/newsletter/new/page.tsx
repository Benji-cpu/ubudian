import { NewsletterComposer } from "@/components/admin/newsletter-composer";

export default function NewNewsletterPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">New Newsletter Edition</h1>
      <p className="mt-1 text-muted-foreground">
        Compose a new weekly edition of The Ubudian.
      </p>
      <div className="mt-8">
        <NewsletterComposer />
      </div>
    </div>
  );
}
