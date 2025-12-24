import type { UserbubbleConfig } from "../types";

export function logger(config: UserbubbleConfig) {
  return {
    debug: (...args: unknown[]) => {
      if (config.debug) {
        console.log("[userbubble]", ...args);
      }
    },
    error: (...args: unknown[]) => {
      console.error("[userbubble]", ...args);
    },
  };
}
