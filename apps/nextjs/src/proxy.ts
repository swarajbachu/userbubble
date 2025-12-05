import { organizationQueries } from "@critichut/db/queries";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { cache } from "react";
import { getSession } from "~/auth/server";

// Cache org queries within single request
const getCachedUserOrganizations = cache(async (userId: string) =>
  organizationQueries.listUserOrganizations(userId)
);

const publicPaths = [
  "/sign-in",
  "/sign-up",
  "/api/auth",
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

  if (isPublicPath(pathname) && !isAuthPath(pathname)) {
    return NextResponse.next();
  }

  try {
    // Use cached getSession instead of direct auth.api.getSession
    const session = await getSession();

    const isAuthenticated = !!session?.user;

    if (isAuthPath(pathname)) {
      if (isAuthenticated) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
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
