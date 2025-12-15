/**
 * Link enhancement utilities
 * Automatically adds auth tokens to userbubble links
 */

import { appendTokenToUrl, encodeToken } from "./token";
import type { UserbubbleUser } from "./types";

/**
 * Enhance all userbubble links with auth token
 */
export function enhanceLinks(
  orgSlug: string,
  user: UserbubbleUser | null,
  selector = "a[href*='userbubble.com']"
): void {
  if (!user) {
    return;
  }

  const links = document.querySelectorAll<HTMLAnchorElement>(selector);

  // biome-ignore lint/complexity/noForEach: <its cleaner this way here>
  links.forEach((link) => {
    // Skip if already enhanced
    if (link.hasAttribute("data-userbubble-enhanced")) {
      return;
    }

    // Add click handler
    link.addEventListener("click", (e) => {
      e.preventDefault();

      const token = encodeToken({
        externalId: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        timestamp: user.timestamp,
        organizationSlug: orgSlug,
        signature: user.signature,
      });

      const enhancedUrl = appendTokenToUrl(link.href, token);
      window.location.href = enhancedUrl;
    });

    // Mark as enhanced
    link.setAttribute("data-userbubble-enhanced", "true");
  });
}

/**
 * Remove link enhancements
 */
export function removeEnhancements(
  selector = "a[href*='userbubble.com']"
): void {
  const links = document.querySelectorAll<HTMLAnchorElement>(selector);

  // biome-ignore lint/complexity/noForEach: <its cleaner this way here>
  links.forEach((link) => {
    if (link.hasAttribute("data-userbubble-enhanced")) {
      link.removeAttribute("data-userbubble-enhanced");
      // Clone and replace to remove event listeners
      const newLink = link.cloneNode(true) as HTMLAnchorElement;
      link.parentNode?.replaceChild(newLink, link);
    }
  });
}

/**
 * Watch for new links added to the DOM
 */
export function watchForNewLinks(
  orgSlug: string,
  user: UserbubbleUser | null,
  selector: string
): MutationObserver {
  const observer = new MutationObserver(() => {
    enhanceLinks(orgSlug, user, selector);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return observer;
}
