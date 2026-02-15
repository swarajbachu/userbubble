let embedToken: string | null = null;

export function getEmbedToken(): string | null {
  return embedToken;
}

export function setEmbedToken(token: string | null): void {
  embedToken = token;
}
