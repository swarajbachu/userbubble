export function createLogger(debug: boolean) {
  return {
    debug: (...args: unknown[]) => {
      if (debug) {
        console.log("[userbubble]", ...args);
      }
    },
    warn: (...args: unknown[]) => {
      console.warn("[userbubble]", ...args);
    },
    error: (...args: unknown[]) => {
      console.error("[userbubble]", ...args);
    },
  };
}
