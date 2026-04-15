import type { StorageAdapter } from "@userbubble/core";
import { STORAGE_KEYS } from "@userbubble/core";
import * as SecureStore from "expo-secure-store";

export class ExpoStorage implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  }

  async removeItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  }

  async clear(): Promise<void> {
    // Expo SecureStore doesn't have clear, so we manually remove known keys
    for (const key of Object.values(STORAGE_KEYS)) {
      await this.removeItem(key);
    }
  }
}
