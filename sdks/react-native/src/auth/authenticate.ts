import type { UserbubbleConfig, UserbubbleUser } from "../types";

export type IdentifyResponse = {
  success: boolean;
  organizationSlug: string;
  user: {
    id: string;
    email: string;
    name?: string;
    avatar?: string | null;
  };
};

/**
 * Identify user with Userbubble backend
 * Platform-agnostic endpoint - works for React Native, Web, Desktop!
 */
export async function identify(
  user: UserbubbleUser,
  config: UserbubbleConfig
): Promise<IdentifyResponse> {
  const baseUrl = config.baseUrl ?? "https://app.userbubble.com";
  const url = `${baseUrl}/api/identify`;

  console.log("[userbubble] Calling identify API:", url);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": config.apiKey,
      },
      body: JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      }),
      credentials: "include",
    });

    console.log("[userbubble] API response status:", response.status);

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Unknown error" }));
      throw new Error(
        `[userbubble] Identification failed: ${error.message || response.statusText}`
      );
    }

    const data = await response.json();
    console.log("[userbubble] API response success:", data);
    return data;
  } catch (error) {
    console.error("[userbubble] Fetch error:", error);
    throw error;
  }
}

/**
 * Logout user (clears local storage only - no sessions!)
 */
export async function logout(): Promise<void> {
  // No API call needed - we're stateless!
  // Just clear local storage in the hook
  console.log("[userbubble] Logging out (clearing local storage)");
}
