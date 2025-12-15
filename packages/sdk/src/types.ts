/**
 * TypeScript definitions for Userbubble SDK
 */

/**
 * User identity information with HMAC signature
 */
export type UserbubbleUser = {
  /**
   * Unique user ID from your system
   */
  id: string;

  /**
   * User email address
   */
  email: string;

  /**
   * User display name
   */
  name?: string;

  /**
   * User avatar URL
   */
  avatar?: string;

  /**
   * HMAC signature for authentication
   * Generated server-side using your organization's secret key
   */
  signature: string;

  /**
   * Unix timestamp when signature was created
   */
  timestamp: number;
};

/**
 * SDK configuration options
 */
export type UserbubbleConfig = {
  /**
   * User to identify on initialization
   */
  user?: UserbubbleUser;

  /**
   * Base URL for Userbubble
   * @default "https://app.userbubble.com"
   */
  baseUrl?: string;

  /**
   * Enable auto-login on link clicks
   * @default true
   */
  autoLogin?: boolean;

  /**
   * CSS selector for links to enhance
   * @default "a[href*='userbubble.com']"
   */
  linkSelector?: string;

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;
};

/**
 * Encoded authentication token
 */
export type AuthToken = {
  externalId: string;
  email: string;
  name?: string;
  avatar?: string;
  timestamp: number;
  organizationSlug: string;
  signature: string;
};

/**
 * SDK instance interface
 */
export type IUserbubbleSDK = {
  /**
   * Initialize the SDK
   */
  init(orgSlug: string, config?: UserbubbleConfig): void;

  /**
   * Identify a user
   */
  identify(user: UserbubbleUser): void;

  /**
   * Logout current user
   */
  logout(): void;

  /**
   * Get current identified user
   */
  getUser(): UserbubbleUser | null;

  /**
   * Check if user is identified
   */
  isIdentified(): boolean;

  /**
   * Get organization slug
   */
  getOrgSlug(): string | null;
};
