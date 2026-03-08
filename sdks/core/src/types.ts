export type UserbubbleUser = {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
};

export type UserbubbleCoreConfig = {
  apiKey: string;
  baseUrl?: string;
  useDirectUrls?: boolean;
  debug?: boolean;
};

export type UserbubbleState = {
  isInitialized: boolean;
  isIdentified: boolean;
  user: UserbubbleUser | null;
  organizationSlug: string | null;
  externalId: string | null;
  authToken: string | null;
};

export type IdentifyResponse = {
  success: boolean;
  token: string;
  organizationSlug: string;
  user: {
    id: string;
    email: string;
    name?: string;
    image?: string | null;
  };
};

export type StateListener = () => void;

export type StorageAdapter = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
};

export type EmbedUrlOptions = {
  baseUrl: string;
  orgSlug: string;
  path?: string;
  authToken: string;
};
