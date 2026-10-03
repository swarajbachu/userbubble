import { toNextJsHandler } from "better-auth/next-js";
import { applicationOrigin, auth } from "~/auth/server";

const { GET: baseGet, POST: basePost } = toNextJsHandler(auth);

// Exact origin matches
const allowedOrigins = new Set([
  applicationOrigin,
  "https://app.userbubble.com",
  "https://app.host.local",
]);

// Regex patterns for wildcard domain matching
const USERBUBBLE_SUBDOMAIN_PATTERN =
  /^https:\/\/[a-zA-Z0-9-]+\.userbubble\.com$/;
const GESTURS_SUBDOMAIN_PATTERN = /^https:\/\/[a-zA-Z0-9-]+\.gesturs\.com$/;
const HOST_LOCAL_SUBDOMAIN_PATTERN = /^https:\/\/[a-zA-Z0-9-]+\.host\.local$/;
const LOCALHOST_PATTERN = /^http:\/\/localhost:\d+$/;

const corsHeaders = {
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
  Vary: "Origin",
};

function isOriginAllowed(origin: string): boolean {
  // Check exact matches
  if (allowedOrigins.has(origin)) {
    return true;
  }

  // Check wildcard patterns
  if (
    origin.match(USERBUBBLE_SUBDOMAIN_PATTERN) ||
    origin.match(GESTURS_SUBDOMAIN_PATTERN) ||
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

// The embed-auth/identify endpoint is called from customer domains (any origin)
// It uses API key auth, not cookies, so credentials are not needed
const EMBED_AUTH_IDENTIFY_PATH = "/api/auth/embed-auth/identify";

const embedAuthCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
};

function isEmbedAuthIdentify(req: Request): boolean {
  const url = new URL(req.url);
  return url.pathname === EMBED_AUTH_IDENTIFY_PATH;
}

async function runAuthHandler(
  handler: (req: Request) => Promise<Response>,
  request: Request
): Promise<Response> {
  try {
    const requestId = crypto.randomUUID();
    request.headers.set("x-request-id", requestId);
    const result = await handler(request);
    const response = new Response(result.body, result);
    response.headers.set("x-request-id", requestId);
    return response;
  } catch {
    console.error("AUTH_TRANSPORT_FAILED");
    return Response.json(
      {
        code: "INTERNAL_SERVER_ERROR",
        message: "Authentication request failed",
      },
      { status: 500 }
    );
  }
}

function withCors(handler: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    // Installation tokens authenticate SDK requests without ambient account cookies.
    if (isEmbedAuthIdentify(req)) {
      if (req.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: embedAuthCorsHeaders,
        });
      }
      const res = await runAuthHandler(handler, req);
      const response = new Response(res.body, res);
      for (const [key, value] of Object.entries(embedAuthCorsHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    }

    const origin = req.headers.get("origin") ?? "";
    if (origin && !isOriginAllowed(origin)) {
      return new Response("CORS not allowed", { status: 403 });
    }
    if (req.method === "OPTIONS") {
      return buildCorsResponse(origin, 204);
    }

    const res = await runAuthHandler(handler, req);
    const response = new Response(res.body, res);
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
export const OPTIONS = withCors(baseGet);
