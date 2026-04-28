import { anthropicProvider } from "./anthropic";
import { codexProvider } from "./codex";
import type { AiProvider } from "./types";

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
