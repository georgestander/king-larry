import { describe, expect, it } from "vitest";
import { createInviteToken, isInviteToken } from "@/lib/tokens";

describe("invite tokens", () => {
  it("creates a token with the expected format", () => {
    const token = createInviteToken();
    expect(token.startsWith("inv_")).toBe(true);
    expect(isInviteToken(token)).toBe(true);
  });

  it("rejects invalid tokens", () => {
    expect(isInviteToken("inv_123")).toBe(false);
    expect(isInviteToken("")).toBe(false);
  });
});
