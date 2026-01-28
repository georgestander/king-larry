import { describe, expect, it } from "vitest";

import { MODEL_OPTIONS, getDefaultModel } from "@/lib/models";

describe("MODEL_OPTIONS", () => {
  it("includes curated models for each provider", () => {
    expect(MODEL_OPTIONS.openai.length).toBeGreaterThan(0);
    expect(MODEL_OPTIONS.anthropic.length).toBeGreaterThan(0);
    expect(MODEL_OPTIONS.openrouter.length).toBeGreaterThan(0);
  });

  it("returns a default model for each provider", () => {
    expect(getDefaultModel("openai")).toBeTruthy();
    expect(getDefaultModel("anthropic")).toBeTruthy();
    expect(getDefaultModel("openrouter")).toBeTruthy();
  });
});
