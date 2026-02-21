import { createOpenAI } from "@ai-sdk/openai";
import type { OAuthProvider } from "./types.js";

export const codexProvider: OAuthProvider = {
  id: "codex",
  authType: "oauth",
  createModel(credentials) {
    return createOpenAI({
      baseURL: "https://chatgpt.com/backend-api/codex",
      apiKey: "unused",
      fetch: async (url, init) => {
        const headers = new Headers(init?.headers);
        headers.delete("Authorization");
        headers.set("Authorization", `Bearer ${credentials.accessToken}`);
        if (credentials.accountId) {
          headers.set("ChatGPT-Account-Id", credentials.accountId);
        }
        return fetch(url, { ...init, headers });
      },
    })("codex-mini-latest");
  },
};
