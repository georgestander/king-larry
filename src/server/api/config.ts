"use server";

import { env } from "cloudflare:workers";

import { resolveProvider } from "@/lib/ai";
import { getDefaultModel } from "@/lib/models";
import { errorResponse, json } from "@/server/api/utils";

export const handleConfig = async (request: Request) => {
  if (request.method !== "GET") {
    return errorResponse(405, "Method not allowed");
  }

  const runtimeEnv = env as unknown as Record<string, string | undefined>;
  const providers = {
    openai: Boolean(runtimeEnv.OPENAI_API_KEY),
    anthropic: Boolean(runtimeEnv.ANTHROPIC_API_KEY),
    openrouter: Boolean(runtimeEnv.OPENROUTER_API_KEY),
  };

  const provider = resolveProvider();
  const model = getDefaultModel(provider);

  return json({
    providers,
    defaults: {
      provider,
      model,
      timeLimitMinutes: 15,
    },
  });
};
