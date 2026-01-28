import { describe, expect, it } from "vitest";

import { validateEditorDraft } from "@/lib/editor-validators";

const baseDraft = {
  meta: { title: "Test Survey", subtitle: "Research" },
  briefingMarkdown: "Goal: learn.",
  promptMarkdown: "Prompt",
  questions: [
    { id: 1, topic: "Intro", question: "What brings you here?", probes: [] },
  ],
};

describe("validateEditorDraft", () => {
  it("accepts a valid draft", () => {
    const result = validateEditorDraft(baseDraft);
    expect(result.ok).toBe(true);
  });

  it("rejects missing meta fields", () => {
    const result = validateEditorDraft({
      ...baseDraft,
      meta: { title: "", subtitle: "" },
    });
    expect(result.ok).toBe(false);
  });
});
