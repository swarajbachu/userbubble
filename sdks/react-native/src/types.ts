/**
 * TypeScript definitions for Userbubble React Native SDK
 */

/**
 * User identity information
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
};

/**
 * SDK configuration options
 */
export type UserbubbleConfig = {
  /**
   * Organization API key
   */
  apiKey: string;

  /**
   * Base URL for Userbubble
   * @default "https://app.userbubble.com"
   */
  baseUrl?: string;

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;

  /**
   * Storage type to use
   * @default "auto" (auto-detect Expo vs AsyncStorage)
   */
  storageType?: "expo" | "async-storage" | "auto";

  /**
   * Custom storage implementation
   */
  customStorage?: StorageAdapter;
};

/**
 * Storage adapter interface
 */
export type StorageAdapter = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
};

/**
 * Userbubble context value
 */
export type UserbubbleContextValue = {
  /**
   * Current identified user
   */
  user: UserbubbleUser | null;

  /**
   * Whether SDK is initialized
   */
  isInitialized: boolean;

  /**
   * Whether user is identified
   */
  isIdentified: boolean;

  /**
   * Identify a user
   */
  identify: (user: UserbubbleUser) => Promise<void>;

  /**
   * Logout current user
   */
  logout: () => Promise<void>;

  /**
   * Get current user
   */
  getUser: () => UserbubbleUser | null;

  /**
   * Open Userbubble with authentication
   */
  openUserbubble: (path?: string) => Promise<void>;
};
