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

function isExpoAvailable(): boolean {
  try {
    require("expo-constants");
    return true;
  } catch {
    return false;
  }
}
