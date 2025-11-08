/**
 * Authentication utilities
 */

import { cleanUrl, decodeToken, extractTokenFromUrl } from "./token";

/**
 * Auto-authenticate if auth token is in URL
 */
export async function autoAuthenticate(
  baseUrl: string,
  debug = false
): Promise<boolean> {
  const token = extractTokenFromUrl();

  if (!token) {
    if (debug) {
      console.log("[critichut] No auth token in URL");
    }
    return false;
  }

  if (debug) {
    console.log("[critichut] Auth token found, attempting authentication");
  }

  // Decode token
  const authData = decodeToken(token);
  if (!authData) {
    console.error("[critichut] Invalid auth token");
    cleanUrl();
    return false;
  }

  // Call authentication endpoint
  try {
    const response = await fetch(`${baseUrl}/api/auth/external-login/sign-in`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        externalId: authData.externalId,
        email: authData.email,
        name: authData.name,
        avatar: authData.avatar,
        timestamp: authData.timestamp,
        organizationSlug: authData.organizationSlug,
        signature: authData.signature,
      }),
      credentials: "include", // Important: include cookies
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Unknown error" }));
      console.error("[critichut] Authentication failed:", error);
      cleanUrl();
      return false;
    }

    const result = await response.json();

    if (debug) {
      console.log("[critichut] Authentication successful:", result);
    }

    // Clean URL immediately after successful authentication
    cleanUrl();

    return true;
  } catch (error) {
    console.error("[critichut] Authentication request failed:", error);
    cleanUrl();
    return false;
  }
}

/**
 * Check if user is currently authenticated
 */
export async function checkAuthentication(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/api/auth/get-session`, {
      credentials: "include",
    });

    if (!response.ok) {
      return false;
    }

    const session = await response.json();
    return !!session?.user;
  } catch (_error) {
    return false;
  }
}

/**
 * Logout user
 */
export async function logout(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/api/auth/sign-out`, {
      method: "POST",
      credentials: "include",
    });

    return response.ok;
  } catch {
    console.error("[critichut] Logout failed");
    return false;
  }
}
