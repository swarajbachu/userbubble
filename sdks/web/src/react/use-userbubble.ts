import { useCallback, useContext } from "react";
import type { UserbubbleUser } from "../core/types";
import { UserbubbleContext } from "./provider";

export function useUserbubble() {
  const ctx = useContext(UserbubbleContext);
  if (!ctx) {
    throw new Error("useUserbubble must be used within <UserbubbleProvider>");
  }

  const { sdk, ...state } = ctx;

  const identify = useCallback(
    (user: UserbubbleUser) => sdk.identify(user),
    [sdk]
  );

  const open = useCallback((path?: string) => sdk.open(path), [sdk]);

  const close = useCallback(() => sdk.close(), [sdk]);
  const logout = useCallback(() => sdk.logout(), [sdk]);

  return {
    ...state,
    identify,
    open,
    close,
    logout,
  };
}
