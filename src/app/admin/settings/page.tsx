import { getSiteSettings } from "@/lib/site-settings";
import { SettingsForm } from "./settings-form";

export const metadata = {
  title: "Site Settings | Admin",
};

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Site Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Control which public sections are live. Disabled sections return 404 and are hidden from navigation.
          Admin routes remain fully accessible regardless of these toggles.
        </p>
      </div>

      <SettingsForm initial={settings} />
    </div>
  );
}
