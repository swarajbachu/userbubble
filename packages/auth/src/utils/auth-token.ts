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

/** base64url encoding - supported in Node 18.14+ but not always in @types/node */
const BASE64URL = "base64url" as BufferEncoding;

function deriveKey(secret: string): Uint8Array {
  return new Uint8Array(createHash("sha256").update(secret).digest()); // 32 bytes for AES-256
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
  const iv = new Uint8Array(randomBytes(12));
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    new Uint8Array(cipher.update(JSON.stringify(full), "utf8")),
    new Uint8Array(cipher.final()),
  ]);
  const authTag = cipher.getAuthTag();
  return `${Buffer.from(iv).toString(BASE64URL)}.${encrypted.toString(BASE64URL)}.${authTag.toString(BASE64URL)}`;
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
      new Uint8Array(Buffer.from(ivPart, BASE64URL))
    );
    decipher.setAuthTag(new Uint8Array(Buffer.from(tagPart, BASE64URL)));
    const decrypted = Buffer.concat([
      new Uint8Array(decipher.update(Buffer.from(encPart, BASE64URL))),
      new Uint8Array(decipher.final()),
    ]);
    const payload = JSON.parse(decrypted.toString()) as AuthTokenPayload;
    return payload.exp < Date.now() ? null : payload;
  } catch {
    return null;
  }
}
