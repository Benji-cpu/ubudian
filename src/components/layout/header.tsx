import { getSiteSettings } from "@/lib/site-settings";
import { HeaderBar } from "./header-bar";

/**
 * Light, app-style header (UI refresh 5 Oct 2026, after todo.today): the
 * wordmark, the sections as quiet links with the current one marked, and one
 * call to action — the weekly email.
 *
 * Only the site settings are read here. Who is signed in is read in the
 * browser (HeaderBar), so this header no longer makes every page dynamic.
 */
export async function Header() {
  const settings = await getSiteSettings();
  return <HeaderBar settings={settings} />;
}
