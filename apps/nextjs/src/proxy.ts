import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth } from "~/auth/server";

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
    const session = await auth.api.getSession({
      headers: request.headers,
    });

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

    // // Skip org check for onboarding pages
    if (pathname.match("/")) {
      // If user is on onboarding but already has org, redirect away
      const { organizationQueries: onboardingOrgQueries } = await import(
        "@critichut/db/queries"
      );
      const userOrgs = await onboardingOrgQueries.listUserOrganizations(
        session.user.id
      );

      if (userOrgs.length > 0) {
        // User has orgs, don't let them access onboarding
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      return NextResponse.next();
    }

    // For all other authenticated pages, require org membership
    const { organizationQueries } = await import("@critichut/db/queries");
    const userOrgs = await organizationQueries.listUserOrganizations(
      session.user.id
    );

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
