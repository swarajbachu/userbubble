import type { UserbubbleUser } from "@userbubble/core";
import {
  createLogger,
  DEFAULT_BASE_URL,
  generatePortalUrl,
  identify,
} from "@userbubble/core";
import * as WebBrowser from "expo-web-browser";
// biome-ignore lint/style/useImportType: React must be in scope for JSX with "jsx": "react"
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createStorageAdapter, StorageManager } from "../storage";
import type { UserbubbleContextValue, UserbubbleRNConfig } from "../types";

export const UserbubbleContext = createContext<UserbubbleContextValue | null>(
  null
);

export type UserbubbleProviderProps = {
  config: UserbubbleRNConfig;
  children: React.ReactNode;
};

export function UserbubbleProvider({
  config,
  children,
}: UserbubbleProviderProps) {
  const [user, setUser] = useState<UserbubbleUser | null>(null);
  const [organizationSlug, setOrganizationSlug] = useState<string | null>(null);
  const [_externalId, setExternalId] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [storage, setStorage] = useState<StorageManager | null>(null);

  const log = useMemo(
    () => createLogger(config.debug ?? false),
    [config.debug]
  );

  // Initialize storage and restore user
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const adapter = await createStorageAdapter(config);
        const storageManager = new StorageManager(adapter);

        const [savedUser, savedSlug, savedExternalId, savedToken] =
          await Promise.all([
            storageManager.getUser(),
            storageManager.getOrganizationSlug(),
            storageManager.getExternalId(),
            storageManager.getAuthToken(),
          ]);

        if (cancelled) {
          return;
        }

        setStorage(storageManager);

        if (savedUser) {
          setUser(savedUser);
          log.debug("User restored from storage:", savedUser.email);
        }
        if (savedSlug) {
          setOrganizationSlug(savedSlug);
        }
        if (savedExternalId) {
          setExternalId(savedExternalId);
        }
        if (savedToken) {
          setAuthToken(savedToken);
        }

        setIsInitialized(true);
      } catch (error) {
        log.error("Initialization failed:", error);
        if (!cancelled) {
          setIsInitialized(true);
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [config, log]);

  const identifyUser = useCallback(
    async (newUser: UserbubbleUser) => {
      if (!storage) {
        throw new Error("[userbubble] Storage not initialized");
      }

      log.debug("Identifying user:", newUser.email);

      const response = await identify(newUser, config);

      log.debug("User identified:", response.organizationSlug);

      await Promise.all([
        storage.setUser(newUser),
        storage.setOrganizationSlug(response.organizationSlug),
        storage.setExternalId(newUser.id),
        storage.setAuthToken(response.token),
      ]);

      setUser(newUser);
      setOrganizationSlug(response.organizationSlug);
      setExternalId(newUser.id);
      setAuthToken(response.token);
    },
    [storage, config, log]
  );

  const logoutUser = useCallback(async () => {
    if (!storage) {
      return;
    }

    log.debug("Logging out user");
    await storage.clear();

    setUser(null);
    setOrganizationSlug(null);
    setExternalId(null);
    setAuthToken(null);

    log.debug("User logged out");
  }, [storage, log]);

  const getUser = useCallback(() => user, [user]);

  const getEmbedUrl = useCallback(
    (path?: string): string | null => {
      if (!(organizationSlug && authToken)) {
        return null;
      }
      const baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
      return generatePortalUrl({
        baseUrl,
        orgSlug: organizationSlug,
        path: path ?? "/feedback",
        authToken,
      });
    },
    [organizationSlug, authToken, config.baseUrl]
  );

  const openUserbubble = useCallback(
    async (path = "/feedback") => {
      const url = getEmbedUrl(path);
      if (!url) {
        throw new Error(
          "[userbubble] User not identified. Call identify() first."
        );
      }

      log.debug("Opening Userbubble:", url);

      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        controlsColor: "#000000",
      });
    },
    [getEmbedUrl, log]
  );

  const value: UserbubbleContextValue = {
    user,
    isInitialized,
    isIdentified: user !== null && authToken !== null,
    authToken,
    organizationSlug,
    identify: identifyUser,
    logout: logoutUser,
    getUser,
    openUserbubble,
    getEmbedUrl,
  };

  return (
    <UserbubbleContext.Provider value={value}>
      {children}
    </UserbubbleContext.Provider>
  );
}
