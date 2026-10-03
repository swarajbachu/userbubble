import type { StorageAdapter } from "@userbubble/core";
import { STORAGE_KEYS } from "@userbubble/core";

export class ExpoStorage implements StorageAdapter {
  private readonly storage: typeof import("expo-secure-store");
  constructor() {
    try {
      this.storage = require("expo-secure-store");
    } catch {
      throw new Error(
        "[userbubble] Install expo-secure-store to use Expo storage"
      );
    }
  }

  async getItem(key: string): Promise<string | null> {
    return this.storage.getItemAsync(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    await this.storage.setItemAsync(key, value);
  }

  async removeItem(key: string): Promise<void> {
    await this.storage.deleteItemAsync(key);
  }

  async clear(): Promise<void> {
    // Expo SecureStore doesn't have clear, so we manually remove known keys
    for (const key of Object.values(STORAGE_KEYS)) {
      await this.removeItem(key);
    }
  }
}
