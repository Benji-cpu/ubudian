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

  // 19 Nov 2026: a visitor with no Supabase sign-in cookie (every crawler and
  // most readers) has no session to refresh, so skip the auth network call.
  // /admin still goes through updateSession, which sends them to /login.
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));
  if (!hasAuthCookie && !pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest|js|css|woff2?)$).*)",
  ],
};
