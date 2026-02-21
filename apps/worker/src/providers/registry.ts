import { anthropicProvider } from "./anthropic.js";
import { codexProvider } from "./codex.js";
import type { AiProvider } from "./types.js";

const providers: Record<string, AiProvider> = {
  anthropic: anthropicProvider,
  codex: codexProvider,
};

export function getProvider(id: string): AiProvider {
  const provider = providers[id];
  if (!provider) {
    throw new Error(`Unknown AI provider: "${id}"`);
  }
  return provider;
}
