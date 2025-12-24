import { type NextRequest, NextResponse } from "next/server";
import { auth } from "~/auth/server";

/**
 * Mobile SDK Logout Endpoint
 * POST /api/mobile/logout
 *
 * Logs out the current mobile SDK user session
 */
export async function POST(request: NextRequest) {
  try {
    // Get current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (session) {
      // Invalidate session
      await auth.api.signOut({
        headers: request.headers,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[mobile/logout] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
