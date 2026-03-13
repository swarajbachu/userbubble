import {
  isValidApiKeyFormat,
  validateApiKeyWithOrg,
  verifyAuthToken,
} from "@userbubble/auth";
import { env } from "~/env";

type OrgResult = {
  organization: { id: string; slug: string };
};

type OrgAndUserResult = OrgResult & {
  userId: string;
};

export async function resolveOrg(request: Request): Promise<OrgResult> {
  const apiKey = request.headers.get("X-API-Key");
  if (!(apiKey && isValidApiKeyFormat(apiKey))) {
    throw new ApiAuthError("Invalid or missing API key", 401);
  }

  const validated = await validateApiKeyWithOrg(apiKey);
  if (!validated) {
    throw new ApiAuthError("Invalid or expired API key", 401);
  }

  return { organization: validated.organization };
}

export async function resolveOrgAndUser(
  request: Request
): Promise<OrgAndUserResult> {
  const { organization } = await resolveOrg(request);

  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new ApiAuthError("Missing Authorization header", 401);
  }

  const token = authHeader.slice(7);
  const secret = env.AUTH_SECRET;
  if (!secret) {
    throw new ApiAuthError("Server configuration error", 500);
  }

  const payload = verifyAuthToken(token, secret);
  if (!payload) {
    throw new ApiAuthError("Invalid or expired auth token", 401);
  }

  if (payload.oid !== organization.id) {
    throw new ApiAuthError("Token does not match API key organization", 403);
  }

  return { organization, userId: payload.sub };
}

export class ApiAuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
