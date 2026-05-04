import { notFound } from "next/navigation";
import { getSiteSettings } from "@/lib/site-settings";

export default async function NewsletterLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  if (!settings.newsletter_archive_enabled) notFound();
  return children;
}
