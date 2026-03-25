import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MembersOnlyPaywall() {
  return (
    <div className="rounded-lg border border-brand-gold/20 bg-brand-cream/50 px-6 py-12 text-center">
      <Lock className="mx-auto h-10 w-10 text-brand-gold" />
      <h3 className="mt-4 font-serif text-xl font-bold text-brand-deep-green">
        Members-Only Content
      </h3>
      <p className="mt-2 text-muted-foreground">
        This content is exclusively for Ubudian Insiders. Join to unlock the
        full article and all members-only stories and posts.
      </p>
      <Button asChild className="mt-6 bg-brand-terracotta hover:bg-brand-terracotta/90">
        <Link href="/membership">Become an Insider</Link>
      </Button>
    </div>
  );
}
