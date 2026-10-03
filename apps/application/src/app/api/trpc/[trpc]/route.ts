import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, createTRPCContext } from "@userbubble/api";
import type { NextRequest } from "next/server";

import { applicationOrigin, auth } from "~/auth/server";
import { env } from "~/env";
import { transportIdentityHeaders } from "~/lib/request-identity";

/**
 * Configure CORS headers for cross-domain requests
 * Allows all origins to support user custom domains
 */
const setCorsHeaders = (res: Response, origin?: string | null) => {
  // Allow all origins (users may connect custom domains)
  // Reflect the origin from the request to support credentials
  if (origin) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Access-Control-Allow-Credentials", "true");
  }

  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-trpc-source, x-trpc-accept, trpc-accept, Cookie, Idempotency-Key"
  );
  res.headers.set("Vary", "Origin");
};

export const OPTIONS = (req: NextRequest) => {
  const origin = req.headers.get("origin");
  const response = new Response(null, {
    status: 204,
  });
  setCorsHeaders(response, origin);
  return response;
};

const handler = async (req: NextRequest) => {
  const origin = req.headers.get("origin");

  const requestId = crypto.randomUUID();
  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    router: appRouter,
    req,
    createContext: async () => ({
      ...(await createTRPCContext({
        auth,
        headers: transportIdentityHeaders(req, applicationOrigin),
        authSecret: env.AUTH_SECRET,
      })),
      requestId,
    }),
    onError({ error }) {
      console.error("TRPC_REQUEST_FAILED", { code: error.code });
    },
  });

  setCorsHeaders(response, origin);
  response.headers.set("x-request-id", requestId);
  return response;
};

export { handler as GET, handler as POST };
