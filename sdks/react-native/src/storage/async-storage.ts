import AsyncStorage from "@react-native-async-storage/async-storage";
import type { StorageAdapter } from "../types";

export class AsyncStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    return await AsyncStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }

  async clear(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const userbubbleKeys = keys.filter((key: string) =>
      key.startsWith("userbubble_")
    );
    await AsyncStorage.multiRemove(userbubbleKeys);
  }
}
