import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // 2026-09-15: one name for the retreat product. The URL said
      // "experiences", the nav said "Ubud Retreats", the homepage said
      // "Journeys", the table is `journeys`. It is /retreats now; the old
      // URL has been indexed and linked from emails, so it redirects for good.
      { source: "/experiences", destination: "/retreats", permanent: true },
      { source: "/experiences/:slug", destination: "/retreats/:slug", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
  images: {
    unoptimized: true,
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "api.telegram.org",
      },
      {
        protocol: "https",
        hostname: "media.megatix.com.au",
      },
    ],
  },
};

export default nextConfig;
