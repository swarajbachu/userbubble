import type {
  StorageAdapter,
  UserbubbleCoreConfig,
  UserbubbleUser,
} from "@userbubble/core";

/**
 * React Native SDK configuration — extends core config with storage options
 */
export type UserbubbleRNConfig = UserbubbleCoreConfig & {
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
 * Userbubble context value
 */
export type UserbubbleContextValue = {
  user: UserbubbleUser | null;
  isInitialized: boolean;
  isIdentified: boolean;
  authToken: string | null;
  organizationSlug: string | null;
  identify: (user: UserbubbleUser) => Promise<void>;
  logout: () => Promise<void>;
  getUser: () => UserbubbleUser | null;
  openUserbubble: (path?: string) => Promise<void>;
  getEmbedUrl: (path?: string) => string | null;
};

// Re-export core types
export type { StorageAdapter, UserbubbleUser } from "@userbubble/core";
