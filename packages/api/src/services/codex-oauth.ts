/** biome-ignore-all lint/style/noNonNullAssertion: <explanation> */
/** biome-ignore-all lint/suspicious/noEmptyBlockStatements: <explanation> */
import { loginOpenAICodex } from "@mariozechner/pi-ai";
import { encrypt } from "@userbubble/db/lib/encryption";
import { oauthConnectionQueries } from "@userbubble/db/queries";

/**
 * In-memory map of pending OAuth flows (orgId → pending state).
 * The loginOpenAICodex call stays alive between the initiate and complete API calls.
 */
const pendingFlows = new Map<
  string,
  {
    resolveManualCode: (url: string) => void;
    flowPromise: Promise<{
      refresh: string;
      access: string;
      expires: number;
      [key: string]: unknown;
    }>;
  }
>();

/**
 * Step 1: Start PKCE OAuth flow via pi-ai.
 * Returns the auth URL for the user to open in their browser.
 */
export async function initiateCodexOAuth(organizationId: string) {
  // Clean up any stale flow for this org
  pendingFlows.delete(organizationId);

  let resolveAuthUrl: (url: string) => void;
  const authUrlPromise = new Promise<string>((resolve) => {
    resolveAuthUrl = resolve;
  });

  let resolveManualCode: (url: string) => void;
  const manualCodePromise = new Promise<string>((resolve) => {
    resolveManualCode = resolve;
  });

  // loginOpenAICodex starts a localhost:1455 server (won't receive callbacks on our
  // server, but that's fine — onManualCodeInput races against it and will always win).
  const flowPromise = loginOpenAICodex({
    onAuth: ({ url }) => {
      resolveAuthUrl!(url);
    },
    onManualCodeInput: () => manualCodePromise,
    onPrompt: async () => manualCodePromise,
    onProgress: () => {},
  });

  // Wait for onAuth to fire (happens after async PKCE generation)
  const authUrl = await Promise.race([
    authUrlPromise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Timeout waiting for OAuth URL generation")),
        10_000
      )
    ),
  ]);

  pendingFlows.set(organizationId, {
    resolveManualCode: resolveManualCode!,
    flowPromise,
  });

  await oauthConnectionQueries.upsertPending(organizationId, "codex", {
    verificationUri: authUrl,
    deviceAuthExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });

  return { authUrl };
}

/**
 * Step 2: User pastes the redirect URL from their browser.
 * Resolves the pending flow — pi-ai exchanges the code for tokens via PKCE.
 */
export async function completeCodexOAuth(
  organizationId: string,
  callbackUrl: string
) {
  const pending = pendingFlows.get(organizationId);
  if (!pending) {
    throw new Error("No pending OAuth flow found. Please initiate again.");
  }

  // Unblock the pi-ai flow — it will extract the code and exchange for tokens
  pending.resolveManualCode(callbackUrl);

  const creds = await pending.flowPromise;
  pendingFlows.delete(organizationId);

  const encryptedAccessToken = encrypt(creds.access);
  const encryptedRefreshToken = encrypt(creds.refresh);
  const tokenExpiresAt = new Date(creds.expires);

  // pi-ai attaches accountId to the credentials for Codex
  const accountId =
    typeof creds.accountId === "string" ? creds.accountId : null;

  await oauthConnectionQueries.activate(organizationId, "codex", {
    encryptedAccessToken,
    encryptedRefreshToken,
    tokenExpiresAt,
    accountId,
  });

  return { status: "active" as const };
}

/**
 * Disconnect Codex OAuth and clean up any pending flow.
 */
export async function disconnectCodex(organizationId: string) {
  pendingFlows.delete(organizationId);
  await oauthConnectionQueries.delete(organizationId, "codex");
}
