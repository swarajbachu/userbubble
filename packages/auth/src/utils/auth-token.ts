import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

type AuthTokenPayload = {
  /** userId */
  sub: string;
  /** organizationId */
  oid: string;
  /** externalId */
  eid: string;
  /** expiry timestamp (ms) */
  exp: number;
};

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function deriveKey(secret: string): Buffer {
  return createHash("sha256").update(secret).digest(); // 32 bytes for AES-256
}

/**
 * Create an AES-256-GCM encrypted auth token for embed bearer auth.
 * Token format: base64url(iv).base64url(encrypted).base64url(authTag)
 */
export function createAuthToken(
  payload: Omit<AuthTokenPayload, "exp">,
  secret: string
): string {
  const full: AuthTokenPayload = {
    ...payload,
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const key = deriveKey(secret);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(full), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${encrypted.toString("base64url")}.${authTag.toString("base64url")}`;
}

/**
 * Verify and decrypt an AES-256-GCM auth token. Returns null if invalid or expired.
 */
export function verifyAuthToken(
  token: string,
  secret: string
): AuthTokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [ivPart, encPart, tagPart] = parts;
  if (!(ivPart && encPart && tagPart)) {
    return null;
  }

  try {
    const key = deriveKey(secret);
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(ivPart, "base64url")
    );
    decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encPart, "base64url")),
      decipher.final(),
    ]);
    const payload = JSON.parse(decrypted.toString()) as AuthTokenPayload;
    return payload.exp < Date.now() ? null : payload;
  } catch {
    return null;
  }
}
