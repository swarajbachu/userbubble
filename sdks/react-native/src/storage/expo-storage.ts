// @ts-expect-error - Optional peer dependency, will be available at runtime for Expo apps
import * as SecureStore from "expo-secure-store";
import type { StorageAdapter } from "../types";

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
    // Expo SecureStore doesn't have clear, so we track keys
    await this.removeItem("@userbubble:user");
    await this.removeItem("@userbubble:organizationSlug");
  }
}
