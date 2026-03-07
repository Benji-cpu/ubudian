import Link from "next/link";
import { NotFoundContent } from "@/components/ui/not-found-content";

export default function NotFound() {
  return (
    <div>
      <NotFoundContent
        title="Page not found"
        description="The page you're looking for doesn't exist or has been moved."
      />
      <div className="bg-brand-cream pb-16 text-center">
        <p className="text-sm text-muted-foreground">Try one of these instead:</p>
        <div className="mt-4 flex flex-wrap justify-center gap-4">
          <Link href="/events" className="text-sm font-medium text-brand-deep-green hover:underline">Events</Link>
          <Link href="/stories" className="text-sm font-medium text-brand-deep-green hover:underline">Stories</Link>
          <Link href="/tours" className="text-sm font-medium text-brand-deep-green hover:underline">Tours</Link>
          <Link href="/newsletter" className="text-sm font-medium text-brand-deep-green hover:underline">Newsletter</Link>
        </div>
      </div>
    </div>
  );
}
