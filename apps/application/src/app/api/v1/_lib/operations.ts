import { createTRPCContext } from "@userbubble/api";
import { ApplicationError } from "@userbubble/api/management";
import { auth } from "~/auth/server";
import { env } from "~/env";
import { ApiAuthError, resolveOrg, resolveOrgAndUser } from "./auth";
import { jsonWithCors } from "./cors";

/** Installation identities never inherit a dashboard cookie's authority. */
export async function sdkContext(request: Request, requireUser = false) {
  const { organization } = await resolveOrg(request);
  const authorization = request.headers.get("Authorization");
  if (requireUser || authorization) {
    await resolveOrgAndUser(request);
  }
  const headers = new Headers();
  if (authorization) {
    headers.set("Authorization", authorization);
  }
  const context = await createTRPCContext({
    headers,
    auth,
    authSecret: env.AUTH_SECRET,
  });
  if ((requireUser || authorization) && !context.session) {
    throw new ApiAuthError("Invalid or expired auth token", 401);
  }
  return { organization, context };
}

const statuses = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  TIMEOUT: 504,
  SERVICE_UNAVAILABLE: 503,
} as const;
export function sdkError(error: unknown) {
  if (error instanceof ApiAuthError) {
    return jsonWithCors(
      { error: { code: "UNAUTHORIZED", message: error.message } },
      error.status
    );
  }
  if (error instanceof ApplicationError) {
    return jsonWithCors(
      { error: { code: error.code, message: error.message } },
      statuses[error.code]
    );
  }
  if (error instanceof SyntaxError) {
    return jsonWithCors(
      { error: { code: "BAD_REQUEST", message: "Invalid JSON body" } },
      400
    );
  }
  return jsonWithCors(
    { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
    500
  );
}
