import type { UserbubbleConfig, UserbubbleUser } from "../types";

export type IdentifyResponse = {
  session: {
    id: string;
    userId: string;
    expiresAt: string;
  };
  organizationSlug: string;
  user: {
    id: string;
    email: string;
    name?: string;
    image?: string;
  };
};

/**
 * Identify user with Userbubble backend
 */
export async function identify(
  user: UserbubbleUser,
  config: UserbubbleConfig
): Promise<IdentifyResponse> {
  const baseUrl = config.baseUrl ?? "https://app.userbubble.com";

  const response = await fetch(`${baseUrl}/api/mobile/identify`, {
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

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Unknown error" }));
    throw new Error(
      `[userbubble] Identification failed: ${error.message || response.statusText}`
    );
  }

  return await response.json();
}

/**
 * Logout user
 */
export async function logout(config: UserbubbleConfig): Promise<void> {
  const baseUrl = config.baseUrl ?? "https://app.userbubble.com";

  try {
    await fetch(`${baseUrl}/api/mobile/logout`, {
      method: "POST",
      headers: {
        "X-API-Key": config.apiKey,
      },
      credentials: "include",
    });
  } catch (error) {
    console.error("[userbubble] Logout failed:", error);
  }
}
