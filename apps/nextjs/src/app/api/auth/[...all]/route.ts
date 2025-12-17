import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "~/auth/server";

const { GET: baseGet, POST: basePost } = toNextJsHandler(auth);

// Exact origin matches
const allowedOrigins = new Set([
  "https://app.userbubble.com",
  "https://app.host.local",
]);

// Regex patterns for wildcard domain matching
const USERBUBBLE_SUBDOMAIN_PATTERN =
  /^https:\/\/[a-zA-Z0-9-]+\.userbubble\.com$/;
const HOST_LOCAL_SUBDOMAIN_PATTERN = /^https:\/\/[a-zA-Z0-9-]+\.host\.local$/;
const LOCALHOST_PATTERN = /^http:\/\/localhost:\d+$/;

const corsHeaders = {
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

function isOriginAllowed(origin: string): boolean {
  // Check exact matches
  if (allowedOrigins.has(origin)) {
    return true;
  }

  // Check wildcard patterns
  if (
    origin.match(USERBUBBLE_SUBDOMAIN_PATTERN) ||
    origin.match(HOST_LOCAL_SUBDOMAIN_PATTERN) ||
    origin.match(LOCALHOST_PATTERN)
  ) {
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
    console.log("origin", origin);

    // Only validate origin for cross-origin requests
    // Same-origin requests don't have an Origin header
    if (origin && !isOriginAllowed(origin)) {
      return new Response("CORS not allowed", { status: 403 });
    }

    if (req.method === "OPTIONS") {
      return buildCorsResponse(origin, 204);
    }

    const res = await handler(req);

    const response = new Response(res.body, res);

    // Only add CORS headers for cross-origin requests
    if (origin) {
      for (const [key, value] of Object.entries(corsHeaders)) {
        response.headers.set(key, value);
      }
      response.headers.set("Access-Control-Allow-Origin", origin);
    }

    return response;
  };
}

export const GET = withCors(baseGet);
export const POST = withCors(basePost);
