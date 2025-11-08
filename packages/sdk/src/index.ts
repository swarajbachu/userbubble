/**
 * critichut JavaScript SDK
 *
 * Seamless user identification and authentication for critichut feedback platform
 */

import { logout as authLogout, autoAuthenticate } from "./auth";
import {
  enhanceLinks,
  removeEnhancements,
  watchForNewLinks,
} from "./link-enhancer";
import type { critichutConfig, critichutUser, IcritichutSDK } from "./types";

class critichutSDK implements IcritichutSDK {
  private orgSlug: string | null = null;
  private user: critichutUser | null = null;
  private config: critichutConfig = {};
  private initialized = false;
  private linkObserver: MutationObserver | null = null;

  /**
   * Initialize critichut SDK
   * @param orgSlug - Organization slug (e.g., "acme")
   * @param config - Configuration options
   */
  init(orgSlug: string, config?: critichutConfig): void {
    if (this.initialized) {
      console.warn("[critichut] Already initialized");
      return;
    }

    this.orgSlug = orgSlug;
    this.config = {
      baseUrl: config?.baseUrl ?? "https://app.critichut.com",
      autoLogin: config?.autoLogin ?? true,
      linkSelector: config?.linkSelector ?? "a[href*='critichut.com']",
      debug: config?.debug ?? false,
      ...config,
    };
    this.initialized = true;

    if (this.config.debug) {
      console.log(`[critichut] Initialized for org: ${orgSlug}`, this.config);
    }

    // Auto-authenticate if token in URL
    if (this.config.autoLogin) {
      this.handleAutoAuth();
    }

    // Identify user if provided
    if (config?.user) {
      this.identify(config.user);
    }
  }

  /**
   * Identify a user
   * @param user - User identity with HMAC signature
   */
  identify(user: critichutUser): void {
    if (!this.initialized) {
      throw new Error("[critichut] SDK not initialized. Call init() first.");
    }

    this.user = user;

    if (this.config.debug) {
      console.log("[critichut] User identified:", {
        id: user.id,
        email: user.email,
        name: user.name,
      });
    }

    // Enhance existing links
    if (this.config.autoLogin) {
      this.enhanceAllLinks();
      this.startWatchingLinks();
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    // Clear local user
    this.user = null;

    // Stop watching for links
    if (this.linkObserver) {
      this.linkObserver.disconnect();
      this.linkObserver = null;
    }

    // Remove link enhancements
    removeEnhancements(this.config.linkSelector);

    // Call logout endpoint
    if (this.config.baseUrl) {
      await authLogout(this.config.baseUrl);
    }

    if (this.config.debug) {
      console.log("[critichut] User logged out");
    }
  }

  /**
   * Get current identified user
   */
  getUser(): critichutUser | null {
    return this.user;
  }

  /**
   * Check if user is identified
   */
  isIdentified(): boolean {
    return this.user !== null;
  }

  /**
   * Get organization slug
   */
  getOrgSlug(): string | null {
    return this.orgSlug;
  }

  /**
   * Handle auto-authentication from URL token
   */
  private async handleAutoAuth(): Promise<void> {
    if (!this.config.baseUrl) {
      return;
    }

    const success = await autoAuthenticate(
      this.config.baseUrl,
      this.config.debug
    );

    if (success && this.config.debug) {
      console.log("[critichut] Auto-authentication successful");
    }
  }

  /**
   * Enhance all critichut links
   */
  private enhanceAllLinks(): void {
    if (!(this.orgSlug && this.config.linkSelector)) {
      return;
    }

    enhanceLinks(this.orgSlug, this.user, this.config.linkSelector);
  }

  /**
   * Start watching for new links
   */
  private startWatchingLinks(): void {
    if (this.linkObserver || !this.orgSlug || !this.config.linkSelector) {
      return;
    }

    this.linkObserver = watchForNewLinks(
      this.orgSlug,
      this.user,
      this.config.linkSelector
    );
  }
}

// Create singleton instance
const sdk = new critichutSDK();

// Export singleton and types
export default sdk;
export { critichutSDK };
export type {
  AuthToken,
  critichutConfig,
  critichutUser,
  IcritichutSDK,
} from "./types";

// Browser global
if (typeof window !== "undefined") {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  (window as any).critichut = sdk;
}
