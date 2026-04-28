/** biome-ignore-all lint/nursery/noIncrementDecrement: expected */
import { createOpenAI } from "@ai-sdk/openai";
import type { OAuthProvider } from "./types";

const CODEX_RESPONSES_URL = "https://chatgpt.com/backend-api/codex/responses";

/**
 * Create a logging transform that logs SSE events as they pass through.
 */
function createLoggingStream(original: ReadableStream<Uint8Array>) {
  const decoder = new TextDecoder();
  let eventCount = 0;

  return original.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        const text = decoder.decode(chunk, { stream: true });
        for (const line of text.split("\n")) {
          if (line.startsWith("event: ")) {
            eventCount++;
            console.log(`[codex-sse] #${eventCount} ${line}`);
          }
          if (line.startsWith("data: ")) {
            // Log all data payloads (truncated to 500 chars)
            console.log(`[codex-sse] ${line.slice(0, 500)}`);
          }
        }
        controller.enqueue(chunk);
      },
      flush() {
        console.log(`[codex-sse] Stream ended. Total events: ${eventCount}`);
      },
    })
  );
}

export const codexProvider: OAuthProvider = {
  id: "codex",
  authType: "oauth",
  createModel(credentials) {
    console.log(
      `[codex] Creating model with accountId=${credentials.accountId?.slice(0, 8)}... tokenExpires=${credentials.tokenExpiresAt?.toISOString()}`
    );
    const openai = createOpenAI({
      apiKey: "unused",
      fetch: (async (
        input: string | URL | Request,
        init: RequestInit | undefined
      ) => {
        const headers = new Headers(init?.headers);
        headers.delete("Authorization");
        headers.set("Authorization", `Bearer ${credentials.accessToken}`);
        if (credentials.accountId) {
          headers.set("ChatGPT-Account-Id", credentials.accountId);
        }

        // Rewrite /v1/responses to ChatGPT Codex backend
        const url = new URL(
          typeof input === "string"
            ? input
            : // biome-ignore lint/style/noNestedTernary: expected
              input instanceof URL
              ? input.toString()
              : input.url
        );
        const isResponsesOrChat =
          url.pathname.includes("/v1/responses") ||
          url.pathname.includes("/chat/completions");
        const target = isResponsesOrChat ? CODEX_RESPONSES_URL : url.toString();

        // Codex backend requires "instructions" — ensure it's always present
        let body = init?.body;
        if (
          isResponsesOrChat &&
          init?.method === "POST" &&
          typeof body === "string"
        ) {
          const json = JSON.parse(body);
          if (!json.instructions || String(json.instructions).trim() === "") {
            json.instructions =
              "You are a helpful coding assistant. Follow the user's instructions carefully.";
          }
          json.store = false;

          // Codex backend does not support max_output_tokens
          json.max_output_tokens = undefined;

          // Codex backend requires all properties in "required" array
          if (Array.isArray(json.tools)) {
            for (const t of json.tools) {
              const params = t.parameters ?? t.function?.parameters;
              if (params?.properties && typeof params.properties === "object") {
                params.required = Object.keys(params.properties);
              }
            }
          }

          body = JSON.stringify(json);
          console.log(
            `[codex] Request body keys: ${Object.keys(JSON.parse(body)).join(", ")}`
          );
        }

        console.log(`[codex] ${init?.method ?? "GET"} ${target}`);
        const res = await fetch(target, { ...init, headers, body });
        console.log(
          `[codex] Response status=${res.status} content-type=${res.headers.get("content-type")}`
        );

        if (!res.ok) {
          const text = await res
            .clone()
            .text()
            .catch(() => "");
          console.error(`[codex] Response error: ${text.slice(0, 500)}`);
          return res;
        }

        // Wrap response body with logging stream + fix missing content-type
        if (res.body && isResponsesOrChat) {
          const loggingBody = createLoggingStream(res.body);
          const newHeaders = new Headers(res.headers);
          if (!newHeaders.get("content-type")) {
            newHeaders.set("content-type", "text/event-stream");
          }
          return new Response(loggingBody, {
            status: res.status,
            statusText: res.statusText,
            headers: newHeaders,
          });
        }

        return res;
      }) as typeof globalThis.fetch,
    });
    console.log("[codex] Using Responses API with gpt-5.3-codex");
    return openai.responses("gpt-5.3-codex");
  },
};
