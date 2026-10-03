import { createHash, randomBytes } from "node:crypto";
export const base = process.env.TEST_APP_URL ?? "";
export const local =
  base && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(base);
async function retryRateLimit(request: () => Promise<Response>) {
  let response = await request();
  if (response.status === 429) {
    const seconds = Number(
      response.headers.get("retry-after") ??
        response.headers.get("x-retry-after")
    );
    if (Number.isFinite(seconds) && seconds > 0 && seconds <= 60) {
      await new Promise((resolve) => setTimeout(resolve, seconds * 1000 + 100));
      response = await request();
    }
  }
  return response;
}
export function fixtureFetch(
  input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1]
) {
  return retryRateLimit(() => fetch(input, init));
}
export async function account() {
  const nonce = randomBytes(8).toString("hex");
  const signup = () =>
    fixtureFetch(`${base}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: base },
      body: JSON.stringify({
        name: "Protocol Tester",
        email: `${nonce}@protocol.example`,
        password: `Test-only-${nonce}-password`,
      }),
    });
  const response = await signup();
  if (response.status !== 200) {
    throw new Error(`Test account creation failed (HTTP ${response.status})`);
  }
  const cookie = response.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  const headers = {
    Cookie: cookie,
    Origin: base,
    "Content-Type": "application/json",
  };
  const call = async (path: string, body: unknown) =>
    retryRateLimit(() =>
      fixtureFetch(`${base}${path}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        redirect: "manual",
      })
    );
  const organization = await (
    await call("/api/v2/operations/organization.create", {
      name: "Protocol workspace",
      slug: `protocol-${nonce}`,
    })
  ).json();
  if (typeof organization.data?.id !== "string") {
    throw new Error("Test workspace creation failed");
  }
  return {
    call,
    headers,
    organizationId: organization.data.id as string,
    email: `${nonce}@protocol.example`,
  };
}

export async function oauthConnection({
  call,
  headers,
  organizationId,
}: Awaited<ReturnType<typeof account>>) {
  const registration = await (
    await fixtureFetch(`${base}/api/auth/oauth2/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_name: "MCP protocol test",
        application_type: "native",
        redirect_uris: ["http://127.0.0.1:9876/callback"],
        token_endpoint_auth_method: "none",
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        scope: "userbubble:manage offline_access",
      }),
    })
  ).json();
  if (typeof registration.client_id !== "string") {
    throw new Error("OAuth registration failed");
  }
  const verifier = randomBytes(32).toString("base64url");
  const params = new URLSearchParams({
    client_id: registration.client_id,
    response_type: "code",
    redirect_uri: "http://127.0.0.1:9876/callback",
    scope: "userbubble:manage offline_access",
    resource: `${base}/api/mcp`,
    state: "test-state",
    code_challenge: createHash("sha256").update(verifier).digest("base64url"),
    code_challenge_method: "S256",
  });
  const authorization = await fixtureFetch(
    `${base}/api/auth/oauth2/authorize?${params}`,
    { headers, redirect: "manual" }
  );
  const workspaceUrl =
    authorization.headers.get("location") ?? (await authorization.json()).url;
  let consentUrl = workspaceUrl;
  if (workspaceUrl.includes("/connect/workspace?")) {
    await call("/api/auth/organization/set-active", { organizationId });
    const continued = await (
      await call("/api/auth/oauth2/continue", {
        postLogin: true,
        oauth_query: new URL(workspaceUrl, base).search.slice(1),
      })
    ).json();
    consentUrl = continued.url;
  }
  if (!consentUrl.includes("/connect/consent?")) {
    throw new Error("Expected OAuth consent");
  }
  const consent = await (
    await call("/api/auth/oauth2/consent", {
      accept: true,
      oauth_query: new URL(consentUrl, base).search.slice(1),
    })
  ).json();
  const callback = new URL(consent.url);
  if (callback.searchParams.get("state") !== "test-state") {
    throw new Error("OAuth state mismatch");
  }
  const token = await (
    await fixtureFetch(`${base}/api/auth/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: registration.client_id,
        code: callback.searchParams.get("code") ?? "",
        redirect_uri: "http://127.0.0.1:9876/callback",
        code_verifier: verifier,
        resource: `${base}/api/mcp`,
      }),
    })
  ).json();
  if (typeof token.access_token !== "string") {
    throw new Error("OAuth token exchange failed");
  }
  const mcp = (method: string, parameters?: unknown) =>
    fixtureFetch(`${base}/api/mcp`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "MCP-Protocol-Version": "2025-06-18",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method,
        params: parameters,
      }),
    });
  return mcp;
}
export const parseMcp = (payload: string) => {
  if (!(payload.startsWith("event:") || payload.startsWith("data:"))) {
    return JSON.parse(payload);
  }
  const data = payload.split("\n").find((line) => line.startsWith("data:"));
  if (!data) {
    throw new Error("Missing MCP event data");
  }
  return JSON.parse(data.slice(5));
};

// Only retry explicit HTTP throttling, which occurs before execution. Never retry ambiguous failures.
export async function retryThrottled<A>(work: () => Promise<A>): Promise<A> {
  try {
    return await work();
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "rate_limited" &&
      "retryAfterSeconds" in error &&
      typeof error.retryAfterSeconds === "number" &&
      error.retryAfterSeconds >= 0 &&
      error.retryAfterSeconds <= 60
    ) {
      await new Promise((resolve) =>
        setTimeout(resolve, error.retryAfterSeconds * 1000 + 150)
      );
      return work();
    }
    throw error;
  }
}
