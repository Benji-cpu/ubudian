import { notFound } from "next/navigation";
import { getSiteSettings } from "@/lib/site-settings";

export default async function BlogLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  if (!settings.blog_enabled) notFound();
  return children;
}
