/** biome-ignore-all lint/style/noParameterProperties: expected */
/** biome-ignore-all lint/style/useReadonlyClassProperties: expected */
import type { StorageAdapter } from "@userbubble/core";

export { StorageManager } from "@userbubble/core";

import type { UserbubbleRNConfig } from "../types";

/**
 * Create storage adapter based on configuration
 */
export async function createStorageAdapter(
  config: UserbubbleRNConfig
): Promise<StorageAdapter> {
  const storageType = config.storageType ?? "auto";

  if (config.customStorage) {
    return config.customStorage;
  }

  if (storageType === "expo" || storageType === "auto") {
    try {
      const { ExpoStorage } = await import("./expo-storage");
      return new ExpoStorage();
    } catch (error) {
      if (storageType === "expo") {
        throw error;
      }
    }
  }
  const { AsyncStorageAdapter } = await import("./async-storage");
  return new AsyncStorageAdapter();
}
