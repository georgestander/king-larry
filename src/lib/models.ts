export type ModelProvider = "openai" | "anthropic" | "openrouter";

export type ModelOption = {
  id: string;
  label: string;
};

export const MODEL_OPTIONS: Record<ModelProvider, ModelOption[]> = {
  openai: [
    { id: "gpt-5.2", label: "GPT-5.2 (latest)" },
    { id: "gpt-5.2-codex", label: "GPT-5.2 Codex" },
    { id: "gpt-5.1", label: "GPT-5.1" },
    { id: "gpt-5", label: "GPT-5" },
    { id: "gpt-5-mini", label: "GPT-5 mini" },
    { id: "gpt-5-nano", label: "GPT-5 nano" },
    { id: "gpt-4o", label: "GPT-4o (legacy)" },
  ],
  anthropic: [
    { id: "claude-opus-4-1-20250805", label: "Claude Opus 4.1" },
    { id: "claude-opus-4-20250514", label: "Claude Opus 4" },
    { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
    { id: "claude-3-7-sonnet-20250219", label: "Claude Sonnet 3.7" },
    { id: "claude-3-5-sonnet-20241022", label: "Claude Sonnet 3.5" },
    { id: "claude-3-5-haiku-20241022", label: "Claude Haiku 3.5" },
    { id: "claude-3-haiku-20240307", label: "Claude Haiku 3" },
  ],
  openrouter: [
    { id: "meta-llama/llama-3.1-405b-instruct", label: "Llama 3.1 405B (OpenRouter)" },
    { id: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4 (OpenRouter)" },
    { id: "openai/gpt-4o", label: "GPT-4o (OpenRouter)" },
  ],
};

export const getDefaultModel = (provider: ModelProvider) => MODEL_OPTIONS[provider][0]?.id ?? "";
