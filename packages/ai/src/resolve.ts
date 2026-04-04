import {
  automationApiKeyQueries,
  oauthConnectionQueries,
} from "@userbubble/db/queries";
import type { LanguageModelV1 } from "ai";
import { getProvider } from "./registry";

/**
 * Resolve a model for a specific provider ID (e.g. "anthropic" or "codex").
 * Fetches the appropriate credentials from the DB and creates the model.
 */
export async function resolveModel(
  organizationId: string,
  providerId: string
): Promise<LanguageModelV1> {
  const provider = getProvider(providerId);

  if (provider.authType === "api_key") {
    const apiKey = await automationApiKeyQueries.getDecrypted(
      organizationId,
      providerId
    );
    if (!apiKey) {
      throw new Error(`API key for "${providerId}" not configured`);
    }
    return provider.createModel(apiKey);
  }

  const creds = await oauthConnectionQueries.getDecryptedTokens(
    organizationId,
    providerId
  );
  if (!creds) {
    throw new Error(`OAuth credentials for "${providerId}" not found`);
  }
  return provider.createModel(creds);
}

/**
 * Resolve any available AI model: tries Anthropic key first, falls back to Codex OAuth.
 * Returns null if no provider is available (useful for optional/silent callers like triage).
 */
export async function resolveAnyModel(
  organizationId: string
): Promise<LanguageModelV1 | null> {
  // Try Anthropic API key first
  try {
    return await resolveModel(organizationId, "anthropic");
  } catch {
    // No Anthropic key — try Codex
  }

  // Fall back to Codex OAuth
  try {
    return await resolveModel(organizationId, "codex");
  } catch {
    // No Codex either
  }

  return null;
}

/**
 * Like resolveAnyModel but throws if no provider is available.
 */
export async function resolveAnyModelOrThrow(
  organizationId: string
): Promise<LanguageModelV1> {
  const model = await resolveAnyModel(organizationId);
  if (!model) {
    throw new Error(
      "No AI provider available — configure an Anthropic API key or connect Codex"
    );
  }
  return model;
}
