import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

const AI_TRAINING_CRAWLERS = [
  "CCBot",
  "Bytespider",
  "GPTBot-Training",
  "Anthropic-AI",
  "ImagesiftBot",
  "Omgilibot",
  "FacebookBot",
  "Diffbot",
  "Meta-ExternalAgent",
  "DataForSeoBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: "/admin/" },
      ...AI_TRAINING_CRAWLERS.map((bot) => ({ userAgent: bot, disallow: "/" })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
