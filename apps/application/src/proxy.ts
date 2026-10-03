import { serverReads } from "@userbubble/api/management";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { cache } from "react";
import { auth } from "~/auth/server";
import { getSubdomain } from "~/lib/subdomain";

// Cache org queries within single request
const getCachedUserOrganizations = cache(async (userId: string) =>
  serverReads.organizations(userId)
);

const publicPaths = [
  "/sign-in",
  "/sign-up",
  "/api/auth",
  "/api/trpc",
  "/external",
  "/embed",
  "/api/identify",
  "/_next",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

const authPaths = ["/sign-in", "/sign-up"];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some((path) => pathname.startsWith(path));
}

function isAuthPath(pathname: string): boolean {
  return authPaths.some((path) => pathname.startsWith(path));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") || "";

  // Skip subdomain rewriting for internal paths (API routes, external/embed routes, static assets)
  if (
    pathname.startsWith("/external/") ||
    pathname.startsWith("/embed/") ||
    pathname.startsWith("/not-found") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/.well-known/") ||
    pathname.startsWith("/_next")
  ) {
    return NextResponse.next();
  }

  // Handle subdomain routing for external/public portal
  const subdomain = getSubdomain(hostname);

  if (subdomain) {
    // Verify organization exists
    const org = await serverReads.organizationBySlug(subdomain);
    if (!org) {
      // Org doesn't exist - redirect to 404
      return NextResponse.redirect(new URL("/not-found", request.url));
    }

    // Rewrite subdomain URL to /external/[org] path
    const newPath = `/external/${subdomain}${pathname === "/" ? "" : pathname}`;
    const url = new URL(request.url);
    url.pathname = newPath;
    return NextResponse.rewrite(url);
  }

  // Block reserved subdomains that aren't "app" from accessing the main app
  // e.g. cdn.userbubble.com, admin.userbubble.com should not serve the dashboard
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN;
  if (baseDomain) {
    const host = hostname.split(":")[0];
    if (host?.endsWith(`.${baseDomain}`) && !host.startsWith("app.")) {
      return NextResponse.redirect(new URL("/not-found", request.url));
    }
  }

  if (isPublicPath(pathname) && !isAuthPath(pathname)) {
    return NextResponse.next();
  }

  // With no credentials, auth pages cannot have a session to redirect. Any
  // cookie or Authorization header still goes through full session validation.
  if (
    isAuthPath(pathname) &&
    !request.headers.has("cookie") &&
    !request.headers.has("authorization")
  ) {
    return NextResponse.next();
  }

  try {
    // Use request.headers directly — headers() from next/headers may not work in proxy context
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    const isAuthenticated =
      !!session?.user && session.session.sessionType !== "identified";

    if (isAuthPath(pathname)) {
      if (isAuthenticated) {
        return NextResponse.redirect(new URL("/", request.url));
      }
      return NextResponse.next();
    }

    if (!isAuthenticated) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set(
        "callbackUrl",
        pathname + request.nextUrl.search
      );
      return NextResponse.redirect(signInUrl);
    }

    // Identified/temp users should not access the main app — redirect to sign-in
    // if (session.session.authMethod === "external") {
    //   const signInUrl = new URL("/sign-in", request.url);
    //   return NextResponse.redirect(signInUrl);
    // }

    if (pathname === "/profile") {
      return NextResponse.next();
    }

    if (session.user.name === "User" && !pathname.match("/complete")) {
      const completeUrl = new URL("/complete", request.url);
      completeUrl.searchParams.set(
        "callbackUrl",
        pathname + request.nextUrl.search
      );
      return NextResponse.redirect(completeUrl);
    }

    if (pathname.startsWith("/connect/")) {
      return NextResponse.next();
    }

    // ========== Organization Membership Check ==========

    // Get user orgs once with cached query (used for both root and other paths)
    const userOrgs = await getCachedUserOrganizations(session.user.id);

    // Skip org check for onboarding pages
    if (pathname === "/" || pathname.startsWith("/complete")) {
      // If user still needs to complete their profile, let them through
      if (session.user.name === "User") {
        return NextResponse.next();
      }

      if (userOrgs.length > 0 && userOrgs[0]) {
        // User has orgs and completed profile, don't let them access onboarding
        return NextResponse.redirect(
          new URL(`/org/${userOrgs[0].slug}/feedback`, request.url)
        );
      }

      return NextResponse.next();
    }

    // For all other authenticated pages, require org membership
    if (userOrgs.length === 0) {
      // User has no organizations → redirect to onboarding
      return NextResponse.redirect(new URL("/", request.url));
    }

    // ========== End Organization Check ==========

    return NextResponse.next();
  } catch {
    console.error("[proxy] session lookup failed", {
      operation: "session.resolve",
    });
    if (!isAuthPath(pathname)) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set(
        "callbackUrl",
        pathname + request.nextUrl.search
      );
      return NextResponse.redirect(signInUrl);
    }
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
