import { encrypt } from "@userbubble/db/lib/encryption";
import { oauthConnectionQueries } from "@userbubble/db/queries";

const DEVICE_CODE_URL = "https://auth.openai.com/oauth/device/code";
const TOKEN_URL = "https://auth.openai.com/oauth/token";
const CLIENT_ID =
  process.env.OPENAI_CODEX_CLIENT_ID ?? "app_EMnvsRxmvRMOITOHZMqhLONH";

type DeviceFlowResponse = {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
};

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in?: number;
  token_type: string;
};

type TokenErrorResponse = {
  error: string;
  error_description?: string;
};

/**
 * Initiate OAuth device flow for Codex
 */
export async function initiateCodexDeviceFlow(organizationId: string) {
  const response = await fetch(DEVICE_CODE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      scope: "openid profile email offline_access",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Device flow initiation failed: ${text}`);
  }

  const data = (await response.json()) as DeviceFlowResponse;
  const expiresAt = new Date(Date.now() + data.expires_in * 1000);

  await oauthConnectionQueries.upsertPending(organizationId, "codex", {
    deviceAuthId: data.device_code,
    userCode: data.user_code,
    verificationUri: data.verification_uri,
    deviceAuthExpiresAt: expiresAt,
  });

  return {
    userCode: data.user_code,
    verificationUri: data.verification_uri,
    expiresAt,
  };
}

/**
 * Poll for device auth completion
 */
export async function pollCodexDeviceAuth(organizationId: string) {
  const conn = await oauthConnectionQueries.getStatus(organizationId, "codex");

  if (!conn) {
    return { status: "not_connected" as const };
  }

  if (conn.status === "active") {
    return { status: "active" as const };
  }

  if (
    conn.deviceAuthExpiresAt &&
    conn.deviceAuthExpiresAt.getTime() < Date.now()
  ) {
    return { status: "expired" as const };
  }

  if (!conn.deviceAuthId) {
    return { status: "not_connected" as const };
  }

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      device_code: conn.deviceAuthId,
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
    }),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as TokenErrorResponse;

    if (
      errorData.error === "authorization_pending" ||
      errorData.error === "slow_down"
    ) {
      return { status: "pending" as const };
    }

    if (errorData.error === "expired_token") {
      return { status: "expired" as const };
    }

    if (errorData.error === "access_denied") {
      return { status: "denied" as const };
    }

    throw new Error(
      `Token poll failed: ${errorData.error_description ?? errorData.error}`
    );
  }

  const tokenData = (await response.json()) as TokenResponse;

  // Extract account ID from id_token JWT (base64url decode the payload)
  let accountId: string | null = null;
  if (tokenData.id_token) {
    const payload = tokenData.id_token.split(".")[1];
    if (payload) {
      const decoded = JSON.parse(
        Buffer.from(payload, "base64url").toString("utf-8")
      ) as { sub?: string };
      accountId = decoded.sub ?? null;
    }
  }

  // Encrypt tokens and activate
  const encryptedAccessToken = encrypt(tokenData.access_token);
  const encryptedRefreshToken = tokenData.refresh_token
    ? encrypt(tokenData.refresh_token)
    : null;
  const tokenExpiresAt = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000)
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
 * Disconnect Codex OAuth
 */
export async function disconnectCodex(organizationId: string) {
  await oauthConnectionQueries.delete(organizationId, "codex");
}
