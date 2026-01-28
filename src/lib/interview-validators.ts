import type { InterviewDefinition } from "@/lib/interview-types";

type ValidationResult<T> = {
  ok: true;
  data: T;
} | {
  ok: false;
  errors: string[];
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const validateInterviewDefinition = (value: unknown): ValidationResult<InterviewDefinition> => {
  const errors: string[] = [];

  if (!isObject(value)) {
    return { ok: false, errors: ["Interview definition must be an object."] };
  }

  const meta = value.meta;
  if (!isObject(meta)) {
    errors.push("meta is required.");
  } else {
    ["id", "version", "title", "subtitle"].forEach((key) => {
      if (typeof meta[key] !== "string" || !meta[key]) {
        errors.push(`meta.${key} must be a non-empty string.`);
      }
    });
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
      if (typeof question.topic !== "string") errors.push(`questions[${index}].topic must be a string.`);
      if (typeof question.question !== "string") errors.push(`questions[${index}].question must be a string.`);
      if (question.probes && !Array.isArray(question.probes)) {
        errors.push(`questions[${index}].probes must be an array when provided.`);
      }
    });
  }

  if (errors.length) {
    return { ok: false, errors };
  }

  return { ok: true, data: value as InterviewDefinition };
};
