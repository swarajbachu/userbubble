import { organizationQueries } from "@userbubble/db/queries";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { cache } from "react";
import { getSession } from "~/auth/server";
import { getSubdomain } from "~/lib/subdomain";

// Cache org queries within single request
const getCachedUserOrganizations = cache(async (userId: string) =>
  organizationQueries.listUserOrganizations(userId)
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

  // If already on /external/ or /not-found path, skip subdomain processing (avoid infinite loop)
  if (pathname.startsWith("/external/") || pathname.startsWith("/embed/") || pathname.startsWith("/not-found")) {
    return NextResponse.next();
  }

  // Handle subdomain routing for external/public portal
  const subdomain = getSubdomain(hostname);

  if (subdomain) {
    // Verify organization exists
    const org = await organizationQueries.findBySlug(subdomain);
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

  if (isPublicPath(pathname) && !isAuthPath(pathname)) {
    return NextResponse.next();
  }

  try {
    // Use cached getSession instead of direct auth.api.getSession
    const session = await getSession();
    console.log("session", session);

    const isAuthenticated = !!session?.user;

    if (isAuthPath(pathname)) {
      if (isAuthenticated) {
        return NextResponse.redirect(new URL("/", request.url));
      }
      return NextResponse.next();
    }

    if (!isAuthenticated) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    if (session.user.name === "User" && !pathname.match("/complete")) {
      const completeUrl = new URL("/complete", request.url);
      completeUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(completeUrl);
    }

    // ========== Organization Membership Check ==========

    // Get user orgs once with cached query (used for both root and other paths)
    const userOrgs = await getCachedUserOrganizations(session.user.id);

    // Skip org check for onboarding pages
    if (pathname === "/") {
      if (userOrgs.length > 0 && userOrgs[0]) {
        // User has orgs, don't let them access onboarding
        return NextResponse.redirect(
          new URL(`/org/${userOrgs[0].organization.slug}/feedback`, request.url)
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
    if (!isAuthPath(pathname)) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
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
