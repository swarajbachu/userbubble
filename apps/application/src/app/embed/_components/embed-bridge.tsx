"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { setEmbedToken } from "~/lib/embed-auth-store";

/**
 * Client component that bridges the iframe embed mode.
 * When embed=true is in the URL:
 * - Stores the encrypted auth token in a module-level variable
 * - Token is sent as Bearer header in every tRPC call
 * - Sends postMessage events to parent window
 * - Listens for theme + logout messages from parent
 */
export function EmbedBridge() {
  const searchParams = useSearchParams();
  const isEmbed = searchParams.get("embed") === "true";
  const authToken = searchParams.get("auth_token");

  // Store token synchronously so it's available for tRPC calls immediately
  if (isEmbed && authToken) {
    setEmbedToken(authToken);
  }

  useEffect(() => {
    if (!isEmbed) {
      return;
    }

    // Notify parent that iframe is ready
    if (window.self !== window.top) {
      window.parent.postMessage({ type: "userbubble:ready" }, "*");
    }

    // Listen for theme + logout messages from parent
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

      if (data.type === "userbubble:logout") {
        setEmbedToken(null);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [isEmbed]);

  return null;
}
