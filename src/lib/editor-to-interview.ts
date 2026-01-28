import type { InterviewDefinition } from "@/lib/interview-types";
import type { ScriptEditorDraft } from "@/lib/editor-types";

const ensureString = (value: unknown, fallback: string) =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "survey";

export const interviewFromEditorDraft = (
  draft: ScriptEditorDraft,
  options?: { version?: number | string; metaId?: string },
): InterviewDefinition => {
  const title = ensureString(draft.meta.title, "Untitled Survey");
  const subtitle = ensureString(draft.meta.subtitle, "Narrative Survey");
  const metaId = ensureString(options?.metaId ?? draft.meta.id, slugify(title));
  const versionValue = options?.version ?? draft.meta.version ?? "1.0";
  const version = typeof versionValue === "number" ? String(versionValue) : ensureString(versionValue, "1.0");

  return {
    meta: {
      id: metaId,
      version,
      title,
      subtitle,
      participant: "",
    },
    context: {
      briefingMarkdown: ensureString(draft.briefingMarkdown, ""),
    },
    questions: draft.questions.map((question, index) => ({
      id: typeof question.id === "number" ? question.id : index + 1,
      topic: ensureString(question.topic, "Insight"),
      question: ensureString(question.question, ""),
      probes: question.probes?.length ? question.probes.filter((probe) => probe.trim()) : undefined,
    })),
  };
};

export const editorDraftFromInterview = (definition: InterviewDefinition): ScriptEditorDraft => ({
  meta: {
    title: definition.meta.title,
    subtitle: definition.meta.subtitle,
    id: definition.meta.id,
    version: definition.meta.version,
  },
  briefingMarkdown: definition.context?.briefingMarkdown ?? "",
  promptMarkdown: "",
  questions: definition.questions.map((question) => ({
    id: question.id,
    topic: question.topic,
    question: question.question,
    probes: question.probes ?? [],
  })),
});
