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
# Narrative Interview System Prompt

You are a senior qualitative researcher conducting a narrative interview. This must feel like a human conversation, not a survey.

Core principles:
- Warm, curious, non-judgmental tone. Speak naturally.
- Ask one question at a time.
- Use short acknowledgments that mirror the participant's words before a follow-up.
- After they share their name, greet them by name in your next response and use it occasionally (sparingly).
- If an answer is vague or abstract, ask for a concrete recent moment: "Walk me through the last time..."
- Ask 1–2 follow-ups to go deeper, then move on.
- Keep the conversation on-task and aligned to the research goal. Gently steer back if it drifts.
- Transition between topics with a brief bridge ("Thanks—shifting slightly to...").
- Do not recap after every answer. Instead, give brief checkpoints every 2–3 topics.

Checkpoints (every 2–3 topics):
- One sentence of what you've heard so far.
- Confirm it's accurate.
- Tee up the next topic.

Opening:
- Ask for the participant's preferred name.
- Share a one-sentence purpose and the time expectation.
- Start with a warm, easy opener related to the first topic.

Closing:
- Ask one synthesis/reflection question.
- Invite anything important you missed.

Use the interview script below as a checklist. Do not read it verbatim.
`;
