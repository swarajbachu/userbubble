import { randomBytes } from "node:crypto";
import { compare, hash } from "bcryptjs";

/**
 * API Key utilities for mobile SDK authentication
 */

const API_KEY_PREFIX = "ub_";
const API_KEY_BYTES = 32; // 32 bytes = 64 hex characters
const BCRYPT_ROUNDS = 10;

/**
 * Generate a new API key in format: ub_xxx (64 hex chars after prefix)
 *
 * @example
 * const apiKey = generateApiKey();
 * // Returns: "ub_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2"
 */
export function generateApiKey(): string {
  const randomHex = randomBytes(API_KEY_BYTES).toString("hex");
  return `${API_KEY_PREFIX}${randomHex}`;
}

/**
 * Hash API key for secure storage using bcrypt
 *
 * @param rawKey - The raw API key to hash
 * @returns Promise resolving to bcrypt hash
 */
export async function hashApiKey(rawKey: string): Promise<string> {
  return await hash(rawKey, BCRYPT_ROUNDS);
}

/**
 * Verify API key against stored hash
 *
 * @param rawKey - The raw API key to verify
 * @param keyHash - The stored bcrypt hash
 * @returns Promise resolving to true if key matches
 */
export async function verifyApiKey(
  rawKey: string,
  keyHash: string
): Promise<boolean> {
  return await compare(rawKey, keyHash);
}

/**
 * Get key preview for UI display (last 4 characters)
 *
 * @param rawKey - The raw API key
 * @returns Preview string in format "...abc123"
 *
 * @example
 * getKeyPreview("ub_a1b2c3d4e5f6...x4y5z6");
 * // Returns: "...y5z6"
 */
export function getKeyPreview(rawKey: string): string {
  const lastFour = rawKey.slice(-4);
  return `...${lastFour}`;
}

/**
 * Validate API key format
 *
 * @param key - The key to validate
 * @returns True if key matches expected format
 *
 * @example
 * isValidApiKeyFormat("ub_a1b2c3..."); // true
 * isValidApiKeyFormat("invalid"); // false
 */
export function isValidApiKeyFormat(key: string): boolean {
  if (!key.startsWith(API_KEY_PREFIX)) {
    return false;
  }

  const hexPart = key.slice(API_KEY_PREFIX.length);

  // Should be exactly 64 hex characters (32 bytes)
  if (hexPart.length !== API_KEY_BYTES * 2) {
    return false;
  }

  // Should only contain hex characters (0-9, a-f)
  return /^[\da-f]+$/i.test(hexPart);
}
