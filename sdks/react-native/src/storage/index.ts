/** biome-ignore-all lint/style/noParameterProperties: <explanation> */
/** biome-ignore-all lint/style/useReadonlyClassProperties: <explanation> */
import type {
  StorageAdapter,
  UserbubbleConfig,
  UserbubbleUser,
} from "../types";

const STORAGE_KEYS = {
  USER: "userbubble_user",
  ORG_SLUG: "userbubble_organizationSlug",
  EXTERNAL_ID: "userbubble_externalId",
} as const;

/**
 * Create storage adapter based on configuration
 */
export async function createStorageAdapter(
  config: UserbubbleConfig
): Promise<StorageAdapter> {
  const storageType = config.storageType ?? "auto";

  // Use custom storage if provided
  if (config.customStorage) {
    return config.customStorage;
  }

  // Auto-detect or use specified type
  if (storageType === "expo" || (storageType === "auto" && isExpoAvailable())) {
    const { ExpoStorage } = await import("./expo-storage");
    return new ExpoStorage();
  }

  if (storageType === "async-storage" || storageType === "auto") {
    const { AsyncStorageAdapter } = await import("./async-storage");
    return new AsyncStorageAdapter();
  }

  throw new Error(
    "[userbubble] No storage available. Install expo-secure-store or @react-native-async-storage/async-storage"
  );
}

/**
 * Check if Expo is available
 */
function isExpoAvailable(): boolean {
  try {
    // Try to import expo-constants (available in all Expo apps)
    require("expo-constants");
    return true;
  } catch {
    return false;
  }
}

/**
 * Storage manager with typed methods
 */
export class StorageManager {
  constructor(private adapter: StorageAdapter) {}

  async getUser(): Promise<UserbubbleUser | null> {
    const json = await this.adapter.getItem(STORAGE_KEYS.USER);
    return json ? JSON.parse(json) : null;
  }

  async setUser(user: UserbubbleUser): Promise<void> {
    await this.adapter.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  async removeUser(): Promise<void> {
    await this.adapter.removeItem(STORAGE_KEYS.USER);
  }

  async getOrganizationSlug(): Promise<string | null> {
    return await this.adapter.getItem(STORAGE_KEYS.ORG_SLUG);
  }

  async setOrganizationSlug(slug: string): Promise<void> {
    await this.adapter.setItem(STORAGE_KEYS.ORG_SLUG, slug);
  }

  async getExternalId(): Promise<string | null> {
    return await this.adapter.getItem(STORAGE_KEYS.EXTERNAL_ID);
  }

  async setExternalId(externalId: string): Promise<void> {
    await this.adapter.setItem(STORAGE_KEYS.EXTERNAL_ID, externalId);
  }

  async clear(): Promise<void> {
    await this.adapter.clear();
  }
}
