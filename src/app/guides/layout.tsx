import { notFound } from "next/navigation";
import { getSiteSettings } from "@/lib/site-settings";

export default async function GuidesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();
  if (!settings.guides_enabled) notFound();
  return <>{children}</>;
}
