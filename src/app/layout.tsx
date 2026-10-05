import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { TabBar } from "@/components/layout/tab-bar";
import { Toaster } from "@/components/ui/sonner";
import { FeedbackFab } from "@/components/feedback/feedback-fab";
import { ActivityTrailInstaller } from "@/components/feedback/activity-trail-installer";
import { AuthSync } from "@/components/auth/auth-sync";
import { WelcomeFirstLoginModal } from "@/components/onboarding/welcome-first-login-modal";
import { FeedbackNudge } from "@/components/onboarding/feedback-nudge";
import { ThemeProvider } from "@/components/theme-provider";
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/constants";
import "./globals.css";

// Inter for everything readable (the todo.today-style app look, 5 Oct 2026);
// Lora survives only as the wordmark face (`font-display`).
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="alternate" type="application/rss+xml" title="The Ubudian" href="/feed.xml" />
      </head>
      <body className={`${inter.variable} ${lora.variable} overflow-x-hidden antialiased`}>
        <ThemeProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 pt-14">{children}</main>
            <Footer />
            <TabBar />
          </div>
          <Toaster />
          <FeedbackFab />
          <WelcomeFirstLoginModal />
          <FeedbackNudge />
          <ActivityTrailInstaller />
          <AuthSync />
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
