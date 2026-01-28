import { describe, expect, it } from "vitest";

import { editorDraftFromInterview, interviewFromEditorDraft } from "@/lib/editor-to-interview";

describe("editor conversions", () => {
  it("converts editor draft to interview definition", () => {
    const draft = {
      meta: { title: "Survey", subtitle: "Subtitle" },
      briefingMarkdown: "Goal: Learn",
      promptMarkdown: "Prompt",
      questions: [
        { id: 1, topic: "Topic", question: "Question", probes: ["Probe"] },
      ],
    };
    const definition = interviewFromEditorDraft(draft, { version: 2 });
    expect(definition.meta.title).toBe("Survey");
    expect(definition.meta.version).toBe("2");
    expect(definition.questions).toHaveLength(1);
  });

  it("converts interview definition to editor draft", () => {
    const definition = {
      meta: {
        id: "test",
        version: "1.0",
        title: "Survey",
        subtitle: "Subtitle",
        participant: "",
      },
      context: { briefingMarkdown: "Goal: Learn" },
      questions: [
        { id: 1, topic: "Topic", question: "Question", probes: ["Probe"] },
      ],
    };
    const draft = editorDraftFromInterview(definition);
    expect(draft.meta.title).toBe("Survey");
    expect(draft.questions[0]?.probes).toEqual(["Probe"]);
  });
});
