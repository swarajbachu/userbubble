import type { LanguageModelV1 } from "ai";

export type OAuthCredentials = {
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
  accountId: string | null;
};

export type ApiKeyProvider = {
  readonly id: string;
  readonly authType: "api_key";
  createModel(apiKey: string): LanguageModelV1;
};

export type OAuthProvider = {
  readonly id: string;
  readonly authType: "oauth";
  createModel(credentials: OAuthCredentials): LanguageModelV1;
};

export type AiProvider = ApiKeyProvider | OAuthProvider;
