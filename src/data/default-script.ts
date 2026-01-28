import type { InterviewDefinition } from "@/lib/interview-types";

export const defaultInterview: InterviewDefinition = {
  meta: {
    id: "team-ai-usage",
    version: "1.0",
    title: "Team AI Tools Usage Interview",
    subtitle: "Internal Research",
    participant: "",
  },
  context: {
    briefingMarkdown:
      "Goal: understand how the team uses AI tools (what, how often, for what), what they like/don't like, and any insights to share.",
  },
  questions: [
    {
      id: 1,
      topic: "Tooling Landscape",
      question:
        "What AI tools do you currently use (e.g., ChatGPT, Claude, Gemini, Perplexity, Copilot, internal tools), and what made you choose those?",
    },
    {
      id: 2,
      topic: "Frequency & Triggers",
      question: "How often do you use AI in a typical week, and what usually triggers you to open it?",
    },
    {
      id: 3,
      topic: "Top Use Cases",
      question: "What are your top 3 use cases for AI right now? For each, can you give one recent example?",
    },
    {
      id: 4,
      topic: "Quality & Trust",
      question: "When do you trust AI outputs, and when do you double-check?",
    },
    {
      id: 5,
      topic: "Improvements",
      question: "If we could improve one thing about how our team uses AI, what would it be?",
    },
  ],
};

export const defaultPrompt = `
# Narrative Interview Prompt

Goal: a natural, narrative-driven interview that feels human, warm, and focused.

Rules:
- Ask one question at a time.
- Avoid robotic phrasing and avoid recapping every answer.
- Ask follow-ups only when needed, and connect them to what the participant said.
- Keep the pace steady. If the answer is short, probe with one targeted follow-up.

Start:
- Ask for the participant's preferred name.
- Share a one-sentence purpose statement and reassure there are no right answers.

Use the interview script below as a checklist. Do not read it verbatim.
`;
