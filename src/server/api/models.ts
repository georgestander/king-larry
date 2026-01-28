"use server";

import { MODEL_OPTIONS, type ModelProvider } from "@/lib/models";
import { errorResponse, json } from "@/server/api/utils";

const isProvider = (value: string): value is ModelProvider =>
  value === "openai" || value === "anthropic" || value === "openrouter";

export const handleModels = async (request: Request, provider: string) => {
  if (request.method !== "GET") {
    return errorResponse(405, "Method not allowed");
  }

  if (!isProvider(provider)) {
    return errorResponse(404, "Provider not found");
  }

  return json({
    models: MODEL_OPTIONS[provider],
    source: "curated",
  });
};
