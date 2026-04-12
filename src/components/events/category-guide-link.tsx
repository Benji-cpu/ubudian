import Link from "next/link";
import type { Experience } from "@/types";

interface CategoryGuideLinkProps {
  category: string;
  guide: Experience;
}

export function CategoryGuideLink({ category, guide }: CategoryGuideLinkProps) {
  return (
    <div className="mt-2">
      <Link
        href={`/experiences/${guide.slug}`}
        className="text-sm text-muted-foreground transition-colors hover:text-brand-terracotta"
      >
        What is{" "}
        <span className="font-medium text-brand-terracotta">{category}</span> in
        Ubud? Read the guide{" "}
        <span aria-hidden="true">&rarr;</span>
      </Link>
    </div>
  );
}
