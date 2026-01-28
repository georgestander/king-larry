import { describe, expect, it } from "vitest";
import { validateInterviewDefinition } from "@/lib/interview-validators";

const validInterview = {
  meta: {
    id: "team-ai-usage",
    version: "1.0",
    title: "Team AI Tools Usage Interview",
    subtitle: "Internal Research",
  },
  context: {
    briefingMarkdown: "Goal: understand AI usage.",
  },
  questions: [
    {
      id: 1,
      topic: "Tooling",
      question: "What AI tools do you use?",
    },
  ],
};

describe("validateInterviewDefinition", () => {
  it("accepts a valid interview definition", () => {
    const result = validateInterviewDefinition(validInterview);
    expect(result.ok).toBe(true);
  });

  it("rejects invalid interview definitions", () => {
    const result = validateInterviewDefinition({ meta: {}, questions: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });
});
