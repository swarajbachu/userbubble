import { NextResponse } from "next/server";
import { auth } from "~/auth/server";

/**
 * Token-to-session exchange endpoint.
 *
 * This is a plain Next.js route handler (NOT a Better Auth endpoint),
 * so it bypasses Better Auth's CORS/CSRF middleware entirely.
 * The nextCookies() plugin sets the session cookie via Next.js cookies() API.
 */
export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const result = await auth.api.embedAuthSession({
      body: { token },
      headers: request.headers,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Exchange failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
