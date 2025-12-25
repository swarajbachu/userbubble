import * as SecureStore from "expo-secure-store";
import type { StorageAdapter } from "../types";

const STORAGE_KEYS = {
  USER: "userbubble_user",
  ORG_SLUG: "userbubble_organizationSlug",
} as const;

export class ExpoStorage implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    return await SecureStore.getItemAsync(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  }

  async removeItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  }

  async clear(): Promise<void> {
    // Expo SecureStore doesn't have clear, so we manually remove known keys
    await this.removeItem(STORAGE_KEYS.USER);
    await this.removeItem(STORAGE_KEYS.ORG_SLUG);
  }
}
