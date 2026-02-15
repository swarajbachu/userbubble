import type {
  IdentifyResponse,
  UserbubbleUser,
  UserbubbleWebConfig,
} from "./types";

export async function identify(
  user: UserbubbleUser,
  config: UserbubbleWebConfig
): Promise<IdentifyResponse> {
  const baseUrl = config.baseUrl ?? "https://app.userbubble.com";
  const url = `${baseUrl}/api/auth/embed-auth/identify`;

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
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Unknown error" }));
    throw new Error(
      `[userbubble] Identification failed: ${error.message || response.statusText}`
    );
  }

  return response.json();
}
