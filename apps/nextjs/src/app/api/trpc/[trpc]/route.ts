import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, createTRPCContext } from "@userbubble/api";
import type { NextRequest } from "next/server";

import { auth } from "~/auth/server";

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
    "Content-Type, Authorization, x-trpc-source, Cookie"
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

  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    router: appRouter,
    req,
    createContext: () =>
      createTRPCContext({
        auth,
        headers: req.headers,
      }),
    onError({ error, path }) {
      console.error(`>>> tRPC Error on '${path}'`, error);
    },
  });

  setCorsHeaders(response, origin);
  return response;
};

export { handler as GET, handler as POST };
