"use client";

import { NewsletterList } from "@/components/admin/content/newsletter-list";
import type { NewsletterEdition } from "@/types";

interface ContentTabsProps {
  editions: NewsletterEdition[];
}

/**
 * Blog and stories tabs were removed 2026-09-15: their content was deleted on
 * 2026-08-03 and the public sections are flag-disabled. Newsletter editions
 * remain until Ben decides what the weekly newsletter is (CRM).
 */
export function ContentTabs({ editions }: ContentTabsProps) {
  return <NewsletterList editions={editions} />;
}
