import type { ScriptEditorDraft } from "@/lib/editor-types";

type ValidationResult<T> = {
  ok: true;
  data: T;
} | {
  ok: false;
  errors: string[];
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const validateEditorDraft = (value: unknown): ValidationResult<ScriptEditorDraft> => {
  const errors: string[] = [];

  if (!isObject(value)) {
    return { ok: false, errors: ["Draft must be an object."] };
  }

  const meta = value.meta;
  if (!isObject(meta)) {
    errors.push("meta is required.");
  } else {
    if (typeof meta.title !== "string" || !meta.title.trim()) {
      errors.push("meta.title must be a non-empty string.");
    }
    if (typeof meta.subtitle !== "string" || !meta.subtitle.trim()) {
      errors.push("meta.subtitle must be a non-empty string.");
    }
  }

  if (typeof value.briefingMarkdown !== "string") {
    errors.push("briefingMarkdown must be a string.");
  }

  if (typeof value.promptMarkdown !== "string") {
    errors.push("promptMarkdown must be a string.");
  }

  if (!Array.isArray(value.questions) || value.questions.length === 0) {
    errors.push("questions must be a non-empty array.");
  } else {
    value.questions.forEach((question, index) => {
      if (!isObject(question)) {
        errors.push(`questions[${index}] must be an object.`);
        return;
      }
      if (typeof question.id !== "number") errors.push(`questions[${index}].id must be a number.`);
      if (typeof question.topic !== "string" || !question.topic.trim()) {
        errors.push(`questions[${index}].topic must be a non-empty string.`);
      }
      if (typeof question.question !== "string" || !question.question.trim()) {
        errors.push(`questions[${index}].question must be a non-empty string.`);
      }
      if (!Array.isArray(question.probes)) {
        errors.push(`questions[${index}].probes must be an array.`);
      }
    });
  }

  if (errors.length) {
    return { ok: false, errors };
  }

  return { ok: true, data: value as ScriptEditorDraft };
};
