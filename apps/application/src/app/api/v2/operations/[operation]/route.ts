import {
  ApplicationError,
  executeOperation,
  operationCatalog,
} from "@userbubble/api/management";
import { applicationOrigin, auth } from "~/auth/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ operation: string }> }
) {
  const requestId = crypto.randomUUID();
  const { operation: id } = await params;
  const operation = operationCatalog[id];
  if (!operation) {
    return Response.json(
      { error: { code: "NOT_FOUND", requestId } },
      { status: 404 }
    );
  }
  try {
    const input: unknown = await request.json();
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw new ApplicationError({ code: "BAD_REQUEST" });
    }
    if (request.headers.has("authorization")) {
      // Never fall back to cookies or installation keys for a failed agent credential.
      const agentHeaders = new Headers(request.headers);
      agentHeaders.set("x-request-id", requestId);
      const result = await auth.handler(
        new Request(new URL("/api/auth/capability/execute", request.url), {
          method: "POST",
          headers: agentHeaders,
          body: JSON.stringify({ capability: id, arguments: input }),
        })
      );
      const response = new Response(result.body, result);
      response.headers.set("x-request-id", requestId);
      return response;
    }
    if (request.headers.get("origin") !== applicationOrigin) {
      throw new ApplicationError({ code: "FORBIDDEN" });
    }
    const session = await auth.api.getSession({ headers: request.headers });
    if (
      !session ||
      (session.session as { sessionType?: string }).sessionType === "identified"
    ) {
      throw new ApplicationError({ code: "UNAUTHORIZED" });
    }
    const data = await executeOperation(
      operation,
      {
        authApi: auth.api,
        requestId,
        headers: request.headers,
        session,
        isIdentified: false,
        identifiedOrgId: null,
      },
      input
    );
    return Response.json({ data, requestId });
  } catch (cause) {
    const error =
      cause instanceof ApplicationError
        ? cause
        : new ApplicationError({
            code:
              cause instanceof SyntaxError
                ? "BAD_REQUEST"
                : "INTERNAL_SERVER_ERROR",
          });
    const status = {
      BAD_REQUEST: 400,
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      CONFLICT: 409,
      TOO_MANY_REQUESTS: 429,
      INTERNAL_SERVER_ERROR: 500,
      TIMEOUT: 504,
      SERVICE_UNAVAILABLE: 503,
    }[error.code];
    return Response.json(
      { error: { code: error.code, message: error.message, requestId } },
      { status }
    );
  }
}
