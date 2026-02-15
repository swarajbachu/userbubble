import type { UserbubbleUser } from "./types";

const PREFIX = "userbubble_";

function getItem(key: string): string | null {
  try {
    return localStorage.getItem(`${PREFIX}${key}`);
  } catch {
    return null;
  }
}

function setItem(key: string, value: string): void {
  try {
    localStorage.setItem(`${PREFIX}${key}`, value);
  } catch {
    // localStorage unavailable (SSR, private browsing, quota exceeded)
  }
}

function removeItem(key: string): void {
  try {
    localStorage.removeItem(`${PREFIX}${key}`);
  } catch {
    // noop
  }
}

export function getUser(): UserbubbleUser | null {
  const raw = getItem("user");
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as UserbubbleUser;
  } catch {
    return null;
  }
}

export function setUser(user: UserbubbleUser): void {
  setItem("user", JSON.stringify(user));
}

export function getOrganizationSlug(): string | null {
  return getItem("org_slug");
}

export function setOrganizationSlug(slug: string): void {
  setItem("org_slug", slug);
}

export function getExternalId(): string | null {
  return getItem("external_id");
}

export function setExternalId(id: string): void {
  setItem("external_id", id);
}

export function getAuthToken(): string | null {
  return getItem("auth_token");
}

export function setAuthToken(token: string): void {
  setItem("auth_token", token);
}

export function clear(): void {
  removeItem("user");
  removeItem("org_slug");
  removeItem("external_id");
  removeItem("auth_token");
}
