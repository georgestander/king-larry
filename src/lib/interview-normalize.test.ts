import { describe, expect, it } from "vitest";

import { normalizeGeneratedInterview } from "@/lib/interview-normalize";

describe("normalizeGeneratedInterview", () => {
  it("fills missing meta fields and ensures 5 questions", () => {
    const normalized = normalizeGeneratedInterview(
      {
        questions: [{ question: "What did you notice?", topic: "Observations" }],
      },
      { title: "Onboarding Survey", goal: "Understand friction." },
    );

    expect(normalized.meta.title).toBe("Onboarding Survey");
    expect(normalized.meta.subtitle).toContain("Narrative");
    expect(normalized.questions.length).toBeGreaterThanOrEqual(5);
  });
});
