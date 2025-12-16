/** biome-ignore-all lint/performance/useTopLevelRegex: regex patterns used for runtime origin validation */
import { auth } from "~/auth/server";

// Define allowed origins for CORS
const allowedOrigins = new Set([
  "https://app.userbubble.com",
  "https://delulusocial.userbubble.com",
]);

const corsHeaders = {
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
  "Access-Control-Allow-Credentials": "true",
};

function isOriginAllowed(origin: string): boolean {
  // Check exact matches
  if (allowedOrigins.has(origin)) {
    return true;
  }

  // Check wildcard pattern for *.userbubble.com
  if (origin.match(/^https:\/\/[a-zA-Z0-9-]+\.userbubble\.com$/)) {
    return true;
  }

  // Allow localhost for development
  if (origin.match(/^http:\/\/localhost:\d+$/)) {
    return true;
  }

  return false;
}

function buildCorsResponse(
  origin: string,
  status: number,
  body: BodyInit | null = null
) {
  return new Response(body, {
    status,
    headers: {
      ...corsHeaders,
      "Access-Control-Allow-Origin": origin,
    },
  });
}

function withCors(handler: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    const origin = req.headers.get("origin") ?? "";

    // Check if origin is allowed
    if (origin && !isOriginAllowed(origin)) {
      return new Response("CORS not allowed", { status: 403 });
    }

    // Handle OPTIONS preflight requests
    if (req.method === "OPTIONS") {
      return buildCorsResponse(origin, 204);
    }

    // Execute the actual handler
    const res = await handler(req);

    // Clone response and add CORS headers
    const response = new Response(res.body, res);

    // Copy existing headers from original response
    res.headers.forEach((value, key) => {
      response.headers.set(key, value);
    });

    // Add CORS headers
    if (origin) {
      for (const [key, value] of Object.entries(corsHeaders)) {
        response.headers.set(key, value);
      }
      response.headers.set("Access-Control-Allow-Origin", origin);
    }

    return response;
  };
}

// Wrap handlers with CORS middleware
export const GET = withCors(auth.handler);
export const POST = withCors(auth.handler);
export const OPTIONS = async (req: Request) => {
  const origin = req.headers.get("origin") ?? "";
  if (origin && isOriginAllowed(origin)) {
    return buildCorsResponse(origin, 204);
  }
  return new Response(null, { status: 204 });
};
