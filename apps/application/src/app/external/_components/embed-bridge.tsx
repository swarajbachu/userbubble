"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

/**
 * Client component that bridges the iframe embed mode and handles auth token exchange.
 *
 * When embed=true is in the URL:
 * - Hides the external header and applies minimal chrome
 * - Sends postMessage events to parent window
 * - Listens for theme messages from parent
 *
 * When auth_token is in the URL (from embed roadmap redirect):
 * - Exchanges the encrypted token for a session cookie
 * - Strips the token from the URL to avoid leaking it in browser history
 */
export function EmbedBridge() {
  const searchParams = useSearchParams();
  const isEmbed = searchParams.get("embed") === "true";
  const authToken = searchParams.get("auth_token");

  useEffect(() => {
    // Exchange auth token for session cookie (works for both embed and direct visits)
    if (authToken) {
      fetch("/api/auth/embed-auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: authToken }),
        credentials: "include",
      })
        .then(() => {
          // Strip auth_token from URL to avoid leaking in browser history
          const url = new URL(window.location.href);
          url.searchParams.delete("auth_token");
          window.history.replaceState({}, "", url.toString());
          // Reload to pick up the new session in server components
          window.location.reload();
        })
        .catch(() => {
          // Fail silently — continue as anonymous
        });
    }
  }, [authToken]);

  useEffect(() => {
    if (!isEmbed) {
      return;
    }

    // Hide header and strip padding for embed mode
    const style = document.createElement("style");
    style.id = "userbubble-embed-styles";
    style.textContent = `
      header.sticky { display: none !important; }
      main.container { padding: 0 !important; max-width: 100% !important; }
      .flex.min-h-screen { min-height: auto; }
    `;
    document.head.appendChild(style);

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
      document.getElementById("userbubble-embed-styles")?.remove();
    };
  }, [isEmbed]);

  return null;
}
