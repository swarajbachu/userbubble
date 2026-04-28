import { createAnthropic } from "@ai-sdk/anthropic";
import type { ApiKeyProvider } from "./types.js";

export const anthropicProvider: ApiKeyProvider = {
  id: "anthropic",
  authType: "api_key",
  createModel(apiKey) {
    return createAnthropic({ apiKey })("claude-sonnet-4-20250514");
  },
};
