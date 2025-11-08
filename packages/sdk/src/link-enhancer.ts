/**
 * Link enhancement utilities
 * Automatically adds auth tokens to critichut links
 */

import { appendTokenToUrl, encodeToken } from "./token";
import type { critichutUser } from "./types";

/**
 * Enhance all critichut links with auth token
 */
export function enhanceLinks(
  orgSlug: string,
  user: critichutUser | null,
  selector = "a[href*='critichut.com']"
): void {
  if (!user) {
    return;
  }

  const links = document.querySelectorAll<HTMLAnchorElement>(selector);

  // biome-ignore lint/complexity/noForEach: <its cleaner this way here>
  links.forEach((link) => {
    // Skip if already enhanced
    if (link.hasAttribute("data-critichut-enhanced")) {
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
    link.setAttribute("data-critichut-enhanced", "true");
  });
}

/**
 * Remove link enhancements
 */
export function removeEnhancements(
  selector = "a[href*='critichut.com']"
): void {
  const links = document.querySelectorAll<HTMLAnchorElement>(selector);

  // biome-ignore lint/complexity/noForEach: <explanation>
  links.forEach((link) => {
    if (link.hasAttribute("data-critichut-enhanced")) {
      link.removeAttribute("data-critichut-enhanced");
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
  user: critichutUser | null,
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
