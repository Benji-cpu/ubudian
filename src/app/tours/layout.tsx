import { notFound } from "next/navigation";
import { getSiteSettings } from "@/lib/site-settings";

export default async function ToursLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  if (!settings.tours_enabled) notFound();
  return children;
}
