import { NextResponse } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/billing",
  "/profile",
  "/rtl",
  "/tables",
  "/virtual-reality"
];

const AUTH_PAGES = ["/sign-in", "/sign-up"];

function getCookieNames() {
  return {
    accessTokenCookieName:
      process.env.ACCESS_TOKEN_COOKIE_NAME ?? "creatorflow_access_token",
    refreshTokenCookieName:
      process.env.REFRESH_TOKEN_COOKIE_NAME ?? "creatorflow_refresh_token"
  };
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const { accessTokenCookieName, refreshTokenCookieName } = getCookieNames();
  const hasSessionCookie =
    request.cookies.has(accessTokenCookieName) || request.cookies.has(refreshTokenCookieName);

  if (PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix)) && !hasSessionCookie) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (AUTH_PAGES.includes(pathname) && hasSessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/billing/:path*",
    "/dashboard/:path*",
    "/profile/:path*",
    "/rtl/:path*",
    "/sign-in",
    "/sign-up",
    "/tables/:path*",
    "/virtual-reality/:path*"
  ]
};
