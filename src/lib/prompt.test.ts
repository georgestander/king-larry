import { describe, expect, it } from "vitest";

import { buildSystemPrompt } from "@/lib/prompt";
import type { InterviewDefinition } from "@/lib/interview-types";

const definition: InterviewDefinition = {
  meta: {
    id: "demo",
    version: "1.0",
    title: "Demo Interview",
    subtitle: "Test",
    participant: "",
  },
  context: {
    briefingMarkdown: "Goal: test prompts.",
  },
  questions: [
    {
      id: 1,
      topic: "Warmup",
      question: "How are you today?\nPlease elaborate.",
    },
    {
      id: 2,
      topic: "Goals",
      question: "What outcome would make this interview a success?",
    },
  ],
};

describe("buildSystemPrompt", () => {
  it("includes the base prompt and checklist", () => {
    const prompt = buildSystemPrompt(definition, "Base prompt", 20);
    expect(prompt).toContain("Base prompt");
    expect(prompt).toContain("1. [Warmup] How are you today?");
    expect(prompt).toContain("2. [Goals] What outcome would make this interview a success?");
    expect(prompt).toContain("Time limit: 20 minutes");
  });

  it("omits the time limit when not provided", () => {
    const prompt = buildSystemPrompt(definition, "Base prompt");
    expect(prompt).not.toContain("Time limit:");
  });
});
