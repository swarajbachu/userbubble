import { apiKeyQueries } from "@userbubble/db/queries";
import { hashApiKey } from "./api-key";

/**
 * Efficiently validate API key using HMAC hash
 * Platform-agnostic - works for React Native, Web, Desktop, APIs!
 *
 * Performance: O(1) single DB query by hash (not O(n*m) loops!)
 *
 * @param apiKey - Raw API key from client headers
 * @returns Validated API key with organization, or null if invalid/expired
 *
 * @example
 * const validated = await validateApiKeyWithOrg(apiKey);
 * if (!validated) {
 *   return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
 * }
 * console.log(validated.organization.slug);
 */
export async function validateApiKeyWithOrg(apiKey: string) {
  // Hash the provided key using HMAC-SHA256
  const keyHash = hashApiKey(apiKey);

  // Single database query by hash - O(1) lookup!
  const key = await apiKeyQueries.findByHash(keyHash);

  if (!key) {
    return null;
  }

  // Check expiration
  if (key.expiresAt && new Date() > new Date(key.expiresAt)) {
    return null;
  }

  return {
    apiKey: key,
    organization: key.organization,
  };
}
