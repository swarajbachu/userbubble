import { useContext } from "react";
import { UserbubbleContext } from "../context/userbubble-provider";
import type { UserbubbleContextValue } from "../types";

/**
 * Hook to access Userbubble SDK
 *
 * @throws Error if used outside UserbubbleProvider
 *
 * @example
 * ```typescript
 * const { identify, openUserbubble, isIdentified } = useUserbubble();
 *
 * // Identify user after login
 * await identify({
 *   id: user.id,
 *   email: user.email,
 *   name: user.name,
 * });
 *
 * // Open Userbubble
 * await openUserbubble("/feedback");
 * ```
 */
export function useUserbubble(): UserbubbleContextValue {
  const context = useContext(UserbubbleContext);

  if (!context) {
    throw new Error(
      "[userbubble] useUserbubble must be used within UserbubbleProvider"
    );
  }

  return context;
}
