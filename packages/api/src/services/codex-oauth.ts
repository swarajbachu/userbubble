/** biome-ignore-all lint/performance/useTopLevelRegex: expected */
/** biome-ignore-all lint/style/noNonNullAssertion: expected */
import { randomBytes, subtle } from "node:crypto";
import { encrypt } from "@userbubble/db/lib/encryption";
import { oauthConnectionQueries } from "@userbubble/db/queries";

const CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
const AUTHORIZE_URL = "https://auth.openai.com/oauth/authorize";
const TOKEN_URL = "https://auth.openai.com/oauth/token";
const REDIRECT_URI = "http://localhost:1455/auth/callback";
const SCOPE = "openid profile email offline_access";
const JWT_CLAIM_PATH = "https://api.openai.com/auth";

function base64url(buffer: ArrayBuffer | Uint8Array): string {
  return Buffer.from(buffer as ArrayBuffer)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function generatePKCE() {
  const verifier = base64url(randomBytes(32));
  const digest = await subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier)
  );
  return { verifier, challenge: base64url(digest) };
}

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }
    return JSON.parse(atob(parts[1]!)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Step 1: Generate PKCE params, build auth URL, store verifier in DB.
 */
export async function initiateCodexOAuth(organizationId: string) {
  const { verifier, challenge } = await generatePKCE();
  const state = randomBytes(16).toString("hex");

  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("scope", SCOPE);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", state);
  url.searchParams.set("id_token_add_organizations", "true");
  url.searchParams.set("codex_cli_simplified_flow", "true");
  url.searchParams.set("originator", "userbubble");

  const authUrl = url.toString();

  await oauthConnectionQueries.upsertPending(organizationId, "codex", {
    codeVerifier: verifier,
    codeState: state,
    verificationUri: authUrl,
    deviceAuthExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });

  return { authUrl };
}

/**
 * Step 2: User pastes redirect URL. We extract code, load verifier from DB, exchange for tokens.
 */
export async function completeCodexOAuth(
  organizationId: string,
  callbackUrl: string
) {
  const conn = await oauthConnectionQueries.getStatus(organizationId, "codex");

  if (!conn || conn.status !== "pending" || !conn.deviceAuthId) {
    throw new Error("No pending OAuth flow found. Please initiate again.");
  }

  if (
    conn.deviceAuthExpiresAt &&
    conn.deviceAuthExpiresAt.getTime() < Date.now()
  ) {
    throw new Error("OAuth flow expired. Please initiate again.");
  }

  // Extract code from pasted URL
  const parsed = new URL(callbackUrl);
  const code = parsed.searchParams.get("code");
  if (!code) {
    throw new Error("No authorization code found in the URL.");
  }

  // Verify state if present
  const state = parsed.searchParams.get("state");
  if (state && state !== conn.userCode) {
    throw new Error("State mismatch. Please initiate again.");
  }

  // Exchange code for tokens using PKCE verifier from DB
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      code,
      code_verifier: conn.deviceAuthId,
      redirect_uri: REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Token exchange failed (${response.status}): ${text.slice(0, 200)}`
    );
  }

  const tokens = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };

  if (
    !(tokens.access_token && tokens.refresh_token) ||
    typeof tokens.expires_in !== "number"
  ) {
    throw new Error("Token response missing required fields");
  }

  const encryptedAccessToken = encrypt(tokens.access_token);
  const encryptedRefreshToken = encrypt(tokens.refresh_token);
  const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  // Extract accountId from JWT
  const payload = decodeJwt(tokens.access_token);
  const auth = payload?.[JWT_CLAIM_PATH] as Record<string, unknown> | undefined;
  const accountId =
    typeof auth?.chatgpt_account_id === "string"
      ? auth.chatgpt_account_id
      : null;

  await oauthConnectionQueries.activate(organizationId, "codex", {
    encryptedAccessToken,
    encryptedRefreshToken,
    tokenExpiresAt,
    accountId,
  });

  return { status: "active" as const };
}

/**
 * Disconnect Codex OAuth.
 */
export async function disconnectCodex(organizationId: string) {
  await oauthConnectionQueries.delete(organizationId, "codex");
}
