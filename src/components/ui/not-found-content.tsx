import Link from "next/link";
import { Button } from "@/components/ui/button";

interface NotFoundContentProps {
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}

export function NotFoundContent({
  title = "Wrong turn",
  description = "This page doesn't exist — but there's plenty that does.",
  backHref = "/",
  backLabel = "Back to Home",
}: NotFoundContentProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-brand-cream px-4 text-center">
      <h1 className="font-serif text-5xl font-medium text-brand-deep-green">
        404
      </h1>
      <h2 className="mt-4 font-serif text-2xl text-brand-charcoal">
        {title}
      </h2>
      <p className="mt-2 max-w-md text-muted-foreground">{description}</p>
      <Button asChild className="mt-8">
        <Link href={backHref}>{backLabel}</Link>
      </Button>
    </div>
  );
}
