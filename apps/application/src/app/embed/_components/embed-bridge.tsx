"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

/**
 * Client component that bridges the iframe embed mode.
 * When embed=true is in the URL:
 * - Sends postMessage events to parent window
 * - Listens for theme messages from parent
 */
export function EmbedBridge() {
  const searchParams = useSearchParams();
  const isEmbed = searchParams.get("embed") === "true";

  useEffect(() => {
    if (!isEmbed) {
      return;
    }

    // Notify parent that iframe is ready
    if (window.self !== window.top) {
      window.parent.postMessage({ type: "userbubble:ready" }, "*");
    }

    // Listen for theme messages from parent
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") {
        return;
      }

      if (data.type === "userbubble:theme") {
        if (data.dark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [isEmbed]);

  return null;
}
