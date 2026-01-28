import type { InterviewDefinition } from "@/lib/interview-types";

export const buildSystemPrompt = (definition: InterviewDefinition, basePrompt: string, timeLimitMinutes?: number) => {
  const questionList = definition.questions
    .map((question) => `${question.id}. [${question.topic}] ${question.question.split("\n")[0]}`)
    .join("\n");

  const timeLimitLine = timeLimitMinutes
    ? `\n\nTime limit: ${timeLimitMinutes} minutes. Keep the pace steady and wrap up if time is nearly done.`
    : "";

  return `${basePrompt.trim()}\n\n## Interview Script (Checklist)\n${questionList}${timeLimitLine}`.trim();
};
