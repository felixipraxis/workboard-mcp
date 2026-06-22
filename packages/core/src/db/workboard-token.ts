import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { getWorkboardBaseUrl, getWorkboardTokenEncryptionKey } from "../config";
import { getDb } from "./drizzle";
import { workboardTokens } from "./schema/app";

export interface WorkboardCredential {
  userId: string;
  token: string;
  baseUrl: string;
  v2BaseUrl: string;
  lastVerifiedAt: Date | null;
}

const algorithm = "aes-256-gcm";

function key() {
  return crypto
    .createHash("sha256")
    .update(getWorkboardTokenEncryptionKey())
    .digest();
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function encryptToken(token: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, key(), iv);
  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    "v1",
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptToken(value: string) {
  const [version, iv, authTag, encrypted] = value.split(".");
  if (version !== "v1" || !iv || !authTag || !encrypted) {
    throw new Error("Unsupported Workboard token ciphertext");
  }

  const decipher = crypto.createDecipheriv(
    algorithm,
    key(),
    Buffer.from(iv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(authTag, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export async function hasWorkboardCredential(userId: string) {
  const rows = await getDb()
    .select({ id: workboardTokens.id })
    .from(workboardTokens)
    .where(eq(workboardTokens.userId, userId))
    .limit(1);

  return rows.length > 0;
}

export async function getWorkboardCredential(
  userId: string,
): Promise<WorkboardCredential | null> {
  const rows = await getDb()
    .select({
      userId: workboardTokens.userId,
      encryptedToken: workboardTokens.encryptedToken,
      workboardBaseUrl: workboardTokens.workboardBaseUrl,
      workboardV2BaseUrl: workboardTokens.workboardV2BaseUrl,
      lastVerifiedAt: workboardTokens.lastVerifiedAt,
    })
    .from(workboardTokens)
    .where(eq(workboardTokens.userId, userId))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    userId: row.userId,
    token: decryptToken(row.encryptedToken),
    baseUrl: row.workboardBaseUrl,
    v2BaseUrl: row.workboardV2BaseUrl,
    lastVerifiedAt: row.lastVerifiedAt,
  };
}

export async function upsertWorkboardCredential(input: {
  userId: string;
  token: string;
  baseUrl?: string;
  v2BaseUrl?: string;
}) {
  const baseUrl = (input.baseUrl ?? getWorkboardBaseUrl("v1")).replace(
    /\/$/,
    "",
  );
  const v2BaseUrl = (input.v2BaseUrl ?? getWorkboardBaseUrl("v2")).replace(
    /\/$/,
    "",
  );
  const now = new Date();
  const encryptedToken = encryptToken(input.token);
  const tokenHash = hashToken(input.token);

  await getDb()
    .insert(workboardTokens)
    .values({
      userId: input.userId,
      encryptedToken,
      tokenHash,
      workboardBaseUrl: baseUrl,
      workboardV2BaseUrl: v2BaseUrl,
      lastVerifiedAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: workboardTokens.userId,
      set: {
        encryptedToken,
        tokenHash,
        workboardBaseUrl: baseUrl,
        workboardV2BaseUrl: v2BaseUrl,
        lastVerifiedAt: now,
        updatedAt: now,
      },
    });
}
