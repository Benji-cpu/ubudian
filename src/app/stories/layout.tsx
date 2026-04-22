import { notFound } from "next/navigation";
import { getSiteSettings } from "@/lib/site-settings";

export default async function StoriesLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  if (!settings.stories_enabled) notFound();
  return children;
}
