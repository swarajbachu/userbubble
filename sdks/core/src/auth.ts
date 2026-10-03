import { DEFAULT_BASE_URL } from "./constants";
import type {
  IdentifyResponse,
  UserbubbleCoreConfig,
  UserbubbleUser,
} from "./types";

export async function identify(
  user: UserbubbleUser,
  config: UserbubbleCoreConfig
): Promise<IdentifyResponse> {
  if (!config.apiKey?.trim()) {
    throw new Error(
      "[userbubble] Configure an SDK installation API key before identifying a user"
    );
  }
  const baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
  const url = `${baseUrl}/api/auth/embed-auth/identify`;

  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": config.apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const responseText = await response.text();
    let message = response.statusText;
    try {
      const parsed = JSON.parse(responseText);
      message = parsed.message || message;
    } catch {
      // not JSON
    }
    throw new Error(`[userbubble] Identification failed: ${message}`);
  }

  return response.json();
}
