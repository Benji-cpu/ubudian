import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

const CANONICAL_HOST = "theubudian.life";
const PREVIEW_HOST_SUFFIX = "-bens-projects-9fc2e88a.vercel.app";

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname, search } = request.nextUrl;

  const isCanonical = host === CANONICAL_HOST;
  const isLocalDev = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const isPreview = host.endsWith(PREVIEW_HOST_SUFFIX);
  const isWebhook = pathname.startsWith("/api/webhooks/");
  const isCron = pathname.startsWith("/api/cron/");

  if (!isCanonical && !isLocalDev && !isPreview && !isWebhook && !isCron) {
    const target = new URL(pathname + search, `https://${CANONICAL_HOST}`);
    return NextResponse.redirect(target, 308);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
