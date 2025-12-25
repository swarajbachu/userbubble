/** biome-ignore-all lint/style/useImportType: <explanation> */
/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
import React, { createContext, useCallback, useEffect, useState } from "react";
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
  const [externalId, setExternalId] = useState<string | null>(null);
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

        // Restore user, organization slug, and external ID from storage
        const savedUser = await storageManager.getUser();
        const savedSlug = await storageManager.getOrganizationSlug();
        const savedExternalId = await storageManager.getExternalId();

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

        if (savedExternalId) {
          setExternalId(savedExternalId);
          log.debug("External ID restored:", savedExternalId);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("[userbubble] Initialization failed:", error);
        setIsInitialized(true); // Still mark as initialized to prevent blocking
      }
    }

    init();
  }, [config, log.debug]);

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

        // Save user, organization slug, and external ID to storage
        await storage.setUser(newUser);
        await storage.setOrganizationSlug(response.organizationSlug);
        await storage.setExternalId(newUser.id);

        // Update state
        setUser(newUser);
        setOrganizationSlug(response.organizationSlug);
        setExternalId(newUser.id);
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

      // Call logout (no API call needed - stateless!)
      await auth.logout();

      // Clear storage
      await storage.clear();

      // Clear state
      setUser(null);
      setOrganizationSlug(null);
      setExternalId(null);

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

      if (!externalId) {
        throw new Error(
          "[userbubble] External ID not available. Re-identify user."
        );
      }

      const baseUrl = config.baseUrl ?? "https://app.userbubble.com";
      let url = generateUserbubbleUrl(baseUrl, organizationSlug, path);

      // Add authentication parameters as query params for external user authentication
      const params = new URLSearchParams({
        external_user: externalId,
        api_key: config.apiKey,
      });
      url = `${url}?${params.toString()}`;

      log.debug("Opening Userbubble:", url);

      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        throw new Error(`[userbubble] Cannot open URL: ${url}`);
      }

      await Linking.openURL(url);
    },
    [user, organizationSlug, externalId, config, log]
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
