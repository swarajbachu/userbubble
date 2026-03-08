import { useContext } from "react";
import { UserbubbleContext } from "../context/userbubble-provider";
import type { UserbubbleContextValue } from "../types";

export function useUserbubble(): UserbubbleContextValue {
  const context = useContext(UserbubbleContext);

  if (!context) {
    throw new Error(
      "[userbubble] useUserbubble must be used within UserbubbleProvider"
    );
  }

  return context;
}
