import { describe, expect, it } from "vitest";
import { isTimeExceeded, minutesToMs } from "@/lib/time";

describe("minutesToMs", () => {
  it("converts minutes to milliseconds", () => {
    expect(minutesToMs(1)).toBe(60_000);
    expect(minutesToMs(2.5)).toBe(150_000);
  });

  it("clamps negative minutes to zero", () => {
    expect(minutesToMs(-5)).toBe(0);
  });
});

describe("isTimeExceeded", () => {
  it("returns false when within limit", () => {
    const startedAt = 1_000_000;
    const now = startedAt + 10_000;
    expect(isTimeExceeded(startedAt, 1, now)).toBe(false);
  });

  it("returns true when limit exceeded", () => {
    const startedAt = 1_000_000;
    const now = startedAt + 120_000;
    expect(isTimeExceeded(startedAt, 1, now)).toBe(true);
  });
});
