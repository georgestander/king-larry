import type { InterviewDefinition, InterviewQuestion } from "@/lib/interview-types";

const ensureString = (value: unknown, fallback: string) =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "survey";

const normalizeQuestions = (input: unknown, fallbackTopic: string) => {
  if (!Array.isArray(input)) return [];
  return input
    .map((question, index): InterviewQuestion | null => {
      if (typeof question !== "object" || question === null) return null;
      const record = question as Record<string, unknown>;
      const prompt = ensureString(record.question, "");
      if (!prompt) return null;
      const topic = ensureString(record.topic, fallbackTopic);
      const id = typeof record.id === "number" ? record.id : index + 1;
      const probes = Array.isArray(record.probes)
        ? record.probes.filter((probe) => typeof probe === "string" && probe.trim())
        : undefined;
      return {
        id,
        topic,
        question: prompt,
        probes: probes?.length ? probes : undefined,
      };
    })
    .filter((question): question is InterviewQuestion => Boolean(question));
};

export const normalizeGeneratedInterview = (input: unknown, options: {
  title: string;
  goal: string;
  audience?: string;
}): InterviewDefinition => {
  const record = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
  const meta = typeof record.meta === "object" && record.meta !== null ? record.meta as Record<string, unknown> : {};
  const context = typeof record.context === "object" && record.context !== null ? record.context as Record<string, unknown> : {};

  const title = ensureString(meta.title, ensureString(options.title, "Untitled Survey"));
  const fallbackSubtitle = options.audience ? `Audience: ${options.audience}` : "Narrative Survey";

  const normalized: InterviewDefinition = {
    meta: {
      id: ensureString(meta.id, slugify(title)),
      version: ensureString(meta.version, "1.0"),
      title,
      subtitle: ensureString(meta.subtitle, fallbackSubtitle),
      participant: ensureString(meta.participant, ""),
    },
    context: {
      briefingMarkdown: ensureString(
        context.briefingMarkdown,
        options.goal ? `Goal: ${options.goal}` : "Goal: gather insights.",
      ),
    },
    questions: normalizeQuestions(record.questions, "Insight"),
  };

  const fillers: InterviewQuestion[] = [
    { id: 9001, topic: "Story", question: "Can you walk me through your experience so far?" },
    { id: 9002, topic: "Friction", question: "What felt most confusing or unclear?" },
    { id: 9003, topic: "Delight", question: "What made this process easier than expected?" },
    { id: 9004, topic: "Improvements", question: "What would you change if you could?" },
    { id: 9005, topic: "Open", question: "Is there anything we didn’t ask that matters?" },
  ];

  let nextId = normalized.questions.length + 1;
  while (normalized.questions.length < 5 && fillers.length) {
    const filler = fillers.shift();
    if (!filler) break;
    normalized.questions.push({ ...filler, id: nextId });
    nextId += 1;
  }

  return normalized;
};
