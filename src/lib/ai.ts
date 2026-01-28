"use server";

import { env } from "cloudflare:workers";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export type ModelProvider = "openai" | "anthropic" | "openrouter";

const DEFAULT_MODELS: Record<ModelProvider, string> = {
  openai: "gpt-4o",
  anthropic: "claude-sonnet-4-20250514",
  openrouter: "meta-llama/llama-3.1-405b-instruct",
};

const runtimeEnv = env as unknown as Record<string, string | undefined>;

export const resolveProvider = (input?: string | null): ModelProvider => {
  const normalized = (input ?? runtimeEnv.AI_PROVIDER ?? "").toLowerCase();
  if (normalized === "openrouter") return "openrouter";
  if (normalized === "anthropic") return "anthropic";
  if (normalized === "openai") return "openai";
  if (runtimeEnv.OPENAI_API_KEY) return "openai";
  return "anthropic";
};

export const getModel = (provider: ModelProvider, modelOverride?: string) => {
  const model = modelOverride
    ?? (provider === "openai"
      ? runtimeEnv.OPENAI_MODEL
      : provider === "anthropic"
        ? runtimeEnv.ANTHROPIC_MODEL
        : runtimeEnv.OPENROUTER_MODEL)
    ?? DEFAULT_MODELS[provider];

  if (provider === "openrouter") {
    const openrouter = createOpenRouter({
      apiKey: runtimeEnv.OPENROUTER_API_KEY ?? "",
    });
    return openrouter.chat(model);
  }

  return provider === "openai" ? openai(model) : anthropic(model);
};
