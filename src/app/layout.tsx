import type { Metadata } from "next";
import { Source_Sans_3, Lora } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/sonner";
import { FeedbackFab } from "@/components/feedback/feedback-fab";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/constants";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
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
    <html lang="en">
      <head>
        <link rel="alternate" type="application/rss+xml" title="The Ubudian" href="/feed.xml" />
      </head>
      <body className={`${sourceSans.variable} ${lora.variable} antialiased`}>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1 pt-14">{children}</main>
          <Footer />
        </div>
        <Toaster />
        <FeedbackFab />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
