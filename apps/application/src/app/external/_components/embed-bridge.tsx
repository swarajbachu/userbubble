"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { setEmbedToken } from "~/lib/embed-auth-store";

/**
 * Client component that handles auth token in external portal pages.
 *
 * When auth_token is in the URL (from SDK identify flow):
 * - Stores it as Bearer token for tRPC calls (works in WebView where cookies can't)
 * - Also tries cookie exchange for server-side auth on reload
 * - Strips the token from the URL
 *
 * When embed=true (web widget iframe):
 * - Hides external header and applies minimal chrome
 */
export function EmbedBridge() {
  const searchParams = useSearchParams();
  const isEmbed = searchParams.get("embed") === "true";
  const authToken = searchParams.get("auth_token");

  // Store token synchronously so it's available for tRPC calls immediately
  if (authToken) {
    setEmbedToken(authToken);
  }

  useEffect(() => {
    if (!authToken) {
      return;
    }

    // Exchange token for session cookie
    fetch("/api/embed-exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: authToken }),
      credentials: "include",
    })
      .then(async (res) => {
        const url = new URL(window.location.href);
        url.searchParams.delete("auth_token");
        if (res.ok) {
          window.location.replace(url.toString());
        } else {
          window.history.replaceState({}, "", url.toString());
        }
      })
      .catch(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete("auth_token");
        window.history.replaceState({}, "", url.toString());
      });
  }, [authToken]);

  useEffect(() => {
    if (!isEmbed) {
      return;
    }

    const style = document.createElement("style");
    style.id = "userbubble-embed-styles";
    style.textContent = `
      header.sticky { display: none !important; }
      main.container { padding: 0 !important; max-width: 100% !important; }
      .flex.min-h-screen { min-height: auto; }
    `;
    document.head.appendChild(style);

    if (window.self !== window.top) {
      window.parent.postMessage({ type: "userbubble:ready" }, "*");
    }

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
