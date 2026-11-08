import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Deal links get shared; when a deal lapses, its link should lead to the ones still on. */
export default function DealNotFound() {
  return (
    <section className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="font-serif text-3xl font-semibold text-brand-deep-green dark:text-brand-gold">
        We can&apos;t find this deal
      </h1>
      <p className="mt-3 text-muted-foreground">It may have ended.</p>
      <Button asChild size="lg" className="mt-6">
        <Link href="/deals">See this week&apos;s deals</Link>
      </Button>
    </section>
  );
}
