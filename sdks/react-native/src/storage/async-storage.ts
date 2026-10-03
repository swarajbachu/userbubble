import type { StorageAdapter } from "@userbubble/core";

export class AsyncStorageAdapter implements StorageAdapter {
  private readonly storage: typeof import("@react-native-async-storage/async-storage").default;
  constructor() {
    try {
      const module = require("@react-native-async-storage/async-storage");
      this.storage = module.default ?? module;
    } catch {
      throw new Error(
        "[userbubble] Install @react-native-async-storage/async-storage to use AsyncStorage"
      );
    }
  }

  async getItem(key: string): Promise<string | null> {
    return this.storage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    await this.storage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    await this.storage.removeItem(key);
  }

  async clear(): Promise<void> {
    const keys = await this.storage.getAllKeys();
    const userbubbleKeys = keys.filter((key: string) =>
      key.startsWith("userbubble_")
    );
    await this.storage.multiRemove(userbubbleKeys);
  }
}
