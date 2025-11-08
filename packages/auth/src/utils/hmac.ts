import { createHmac, randomBytes } from "node:crypto";

/**
 * HMAC utilities for external authentication
 */

export type HMACData = {
  externalId: string;
  email: string;
  name?: string;
  timestamp: number;
  organizationSlug: string;
}

/**
 * Verify HMAC signature
 */
export function verifyHMAC(
  data: HMACData,
  signature: string,
  secretKey: string
): boolean {
  const payload = createHMACPayload(data);
  const expectedSignature = createHmac("sha256", secretKey)
    .update(payload)
    .digest("hex");

  // Use timing-safe comparison
  return timingSafeEqual(expectedSignature, signature);
}

/**
 * Create HMAC signature (for customer SDK)
 */
export function createHMACSignature(data: HMACData, secretKey: string): string {
  const payload = createHMACPayload(data);
  return createHmac("sha256", secretKey).update(payload).digest("hex");
}

/**
 * Create HMAC payload string from data
 */
function createHMACPayload(data: HMACData): string {
  const parts = [
    data.externalId,
    data.email,
    data.name || "",
    data.timestamp.toString(),
    data.organizationSlug,
  ];
  return parts.join("|");
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    // biome-ignore lint: bitwise operations required for timing-safe comparison
    result = result | (a.charCodeAt(i) ^ b.charCodeAt(i));
  }
  return result === 0;
}

/**
 * Check if timestamp is valid (within 5 minutes)
 */
export function isTimestampValid(
  timestamp: number,
  maxAgeSeconds = 300
): boolean {
  const now = Math.floor(Date.now() / 1000);
  const diff = Math.abs(now - timestamp);
  return diff <= maxAgeSeconds;
}

/**
 * Generate random secret key for organizations
 */
export function generateSecretKey(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Encrypt secret key for storage (basic implementation)
 * In production, use proper encryption or secrets management
 */
export function encryptSecretKey(secretKey: string): string {
  // For now, we'll store as-is since it's in the database
  // In production, use KMS or similar
  return secretKey;
}

/**
 * Decrypt secret key from storage
 */
export function decryptSecretKey(encryptedKey: string): string {
  // For now, return as-is
  // In production, decrypt from KMS
  return encryptedKey;
}
