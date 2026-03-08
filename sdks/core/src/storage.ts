import { STORAGE_KEYS } from "./constants";
import type { StorageAdapter, UserbubbleUser } from "./types";

export class StorageManager {
  private readonly adapter: StorageAdapter;

  constructor(adapter: StorageAdapter) {
    this.adapter = adapter;
  }

  async getUser(): Promise<UserbubbleUser | null> {
    const json = await this.adapter.getItem(STORAGE_KEYS.USER);
    if (!json) {
      return null;
    }
    try {
      return JSON.parse(json) as UserbubbleUser;
    } catch {
      return null;
    }
  }

  async setUser(user: UserbubbleUser): Promise<void> {
    await this.adapter.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  async removeUser(): Promise<void> {
    await this.adapter.removeItem(STORAGE_KEYS.USER);
  }

  async getOrganizationSlug(): Promise<string | null> {
    return this.adapter.getItem(STORAGE_KEYS.ORG_SLUG);
  }

  async setOrganizationSlug(slug: string): Promise<void> {
    await this.adapter.setItem(STORAGE_KEYS.ORG_SLUG, slug);
  }

  async getExternalId(): Promise<string | null> {
    return this.adapter.getItem(STORAGE_KEYS.EXTERNAL_ID);
  }

  async setExternalId(externalId: string): Promise<void> {
    await this.adapter.setItem(STORAGE_KEYS.EXTERNAL_ID, externalId);
  }

  async getAuthToken(): Promise<string | null> {
    return this.adapter.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  async setAuthToken(token: string): Promise<void> {
    await this.adapter.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  async clear(): Promise<void> {
    await this.adapter.clear();
  }
}
