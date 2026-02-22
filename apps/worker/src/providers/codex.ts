import { createOpenAI } from "@ai-sdk/openai";
import type { OAuthProvider } from "./types.js";

export const codexProvider: OAuthProvider = {
  id: "codex",
  authType: "oauth",
  createModel(credentials) {
    console.log(
      `[codex] Creating model with accountId=${credentials.accountId?.slice(0, 8)}... tokenExpires=${credentials.tokenExpiresAt?.toISOString()}`
    );
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
        console.log(`[codex] ${init?.method ?? "GET"} ${url}`);
        const res = await fetch(url, { ...init, headers });
        if (!res.ok) {
          const body = await res
            .clone()
            .text()
            .catch(() => "");
          console.error(
            `[codex] Response ${res.status}: ${body.slice(0, 500)}`
          );
        }
        return res;
      },
    })("gpt-5.3-codex");
  },
};
