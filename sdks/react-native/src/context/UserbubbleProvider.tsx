import type React from "react";
import { createContext, useCallback, useEffect, useState } from "react";
import { Linking } from "react-native";
import * as auth from "../auth/authenticate";
import { createStorageAdapter, StorageManager } from "../storage";
import type {
  UserbubbleConfig,
  UserbubbleContextValue,
  UserbubbleUser,
} from "../types";
import { logger } from "../utils/logger";
import { generateUserbubbleUrl } from "../utils/url";

export const UserbubbleContext = createContext<UserbubbleContextValue | null>(
  null
);

export type UserbubbleProviderProps = {
  config: UserbubbleConfig;
  children: React.ReactNode;
};

export function UserbubbleProvider({
  config,
  children,
}: UserbubbleProviderProps) {
  const [user, setUser] = useState<UserbubbleUser | null>(null);
  const [organizationSlug, setOrganizationSlug] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [storage, setStorage] = useState<StorageManager | null>(null);

  const log = logger(config);

  // Initialize storage and restore user
  useEffect(() => {
    async function init() {
      try {
        const adapter = await createStorageAdapter(config);
        const storageManager = new StorageManager(adapter);
        setStorage(storageManager);

        // Restore user and organization slug from storage
        const savedUser = await storageManager.getUser();
        const savedSlug = await storageManager.getOrganizationSlug();

        if (savedUser) {
          setUser(savedUser);
          log.debug("User restored from storage:", {
            id: savedUser.id,
            email: savedUser.email,
          });
        }

        if (savedSlug) {
          setOrganizationSlug(savedSlug);
          log.debug("Organization slug restored:", savedSlug);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("[userbubble] Initialization failed:", error);
        setIsInitialized(true); // Still mark as initialized to prevent blocking
      }
    }

    init();
  }, [config]);

  // Identify user
  const identifyUser = useCallback(
    async (newUser: UserbubbleUser) => {
      if (!storage) {
        throw new Error("[userbubble] Storage not initialized");
      }

      try {
        log.debug("Identifying user:", {
          id: newUser.id,
          email: newUser.email,
        });

        // Call backend to identify user
        const response = await auth.identify(newUser, config);

        log.debug("User identified successfully:", {
          userId: response.user.id,
          organizationSlug: response.organizationSlug,
        });

        // Save user and organization slug to storage
        await storage.setUser(newUser);
        await storage.setOrganizationSlug(response.organizationSlug);

        // Update state
        setUser(newUser);
        setOrganizationSlug(response.organizationSlug);
      } catch (error) {
        log.error("Identification failed:", error);
        throw error;
      }
    },
    [storage, config, log]
  );

  // Logout user
  const logoutUser = useCallback(async () => {
    if (!storage) {
      return;
    }

    try {
      log.debug("Logging out user");

      // Call logout endpoint
      await auth.logout(config);

      // Clear storage
      await storage.clear();

      // Clear state
      setUser(null);
      setOrganizationSlug(null);

      log.debug("User logged out successfully");
    } catch (error) {
      log.error("Logout failed:", error);
    }
  }, [storage, config, log]);

  // Get current user
  const getUser = useCallback(() => user, [user]);

  // Open Userbubble
  const openUserbubble = useCallback(
    async (path = "") => {
      if (!user) {
        throw new Error(
          "[userbubble] User not identified. Call identify() first."
        );
      }

      if (!organizationSlug) {
        throw new Error(
          "[userbubble] Organization slug not available. Re-identify user."
        );
      }

      const baseUrl = config.baseUrl ?? "https://app.userbubble.com";
      const url = generateUserbubbleUrl(baseUrl, organizationSlug, path);

      log.debug("Opening Userbubble:", url);

      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        throw new Error(`[userbubble] Cannot open URL: ${url}`);
      }

      await Linking.openURL(url);
    },
    [user, organizationSlug, config, log]
  );

  const value: UserbubbleContextValue = {
    user,
    isInitialized,
    isIdentified: user !== null,
    identify: identifyUser,
    logout: logoutUser,
    getUser,
    openUserbubble,
  };

  return (
    <UserbubbleContext.Provider value={value}>
      {children}
    </UserbubbleContext.Provider>
  );
}
