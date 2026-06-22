import { describe, expect, it } from "vitest";
import { decryptToken, encryptToken, hashToken } from "./workboard-token";

describe("Workboard token storage helpers", () => {
  it("encrypts token values without storing plaintext", () => {
    const token = "wb_personal_token_123";
    const encrypted = encryptToken(token);

    expect(encrypted).not.toContain(token);
    expect(encrypted).toMatch(/^v1\./);
    expect(decryptToken(encrypted)).toBe(token);
  });

  it("hashes tokens deterministically for audit lookups", () => {
    expect(hashToken("same-token")).toBe(hashToken("same-token"));
    expect(hashToken("same-token")).not.toBe(hashToken("other-token"));
  });
});
