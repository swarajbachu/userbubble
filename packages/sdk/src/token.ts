/**
 * Token encoding and decoding utilities
 */

import type { AuthToken } from "./types";

/**
 * Encode authentication data to URL-safe token
 */
export function encodeToken(data: AuthToken): string {
  const jsonString = JSON.stringify(data);
  const base64 = btoa(jsonString);
  // Make URL-safe by replacing characters
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Decode URL-safe token to authentication data
 */
export function decodeToken(token: string): AuthToken | null {
  try {
    // Restore base64 padding and standard characters
    let base64 = token.replace(/-/g, "+").replace(/_/g, "/");
    const padding = base64.length % 4;
    if (padding) {
      base64 += "=".repeat(4 - padding);
    }

    const jsonString = atob(base64);
    const data = JSON.parse(jsonString) as AuthToken;

    // Validate required fields
    if (
      !(
        data.externalId &&
        data.email &&
        data.signature &&
        data.timestamp &&
        data.organizationSlug
      )
    ) {
      return null;
    }

    return data;
  } catch (error) {
    console.error("[userbubble] Failed to decode token:", error);
    return null;
  }
}

/**
 * Extract auth token from URL
 */
export function extractTokenFromUrl(): string | null {
  const url = new URL(window.location.href);
  return url.searchParams.get("auth_token");
}

/**
 * Remove auth token from URL
 */
export function cleanUrl(): void {
  const url = new URL(window.location.href);
  if (url.searchParams.has("auth_token")) {
    url.searchParams.delete("auth_token");
    window.history.replaceState({}, "", url.toString());
  }
}

/**
 * Append auth token to URL
 */
export function appendTokenToUrl(url: string, token: string): string {
  const urlObj = new URL(url);
  urlObj.searchParams.set("auth_token", token);
  return urlObj.toString();
}
