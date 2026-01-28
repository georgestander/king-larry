"use server";

import { env } from "cloudflare:workers";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import { getModel, resolveProvider } from "@/lib/ai";
import { interviewFromEditorDraft } from "@/lib/editor-to-interview";
import { validateEditorDraft } from "@/lib/editor-validators";
import { buildSystemPrompt } from "@/lib/prompt";
import { defaultPrompt } from "@/data/default-script";
import { errorResponse, isMockAiEnabled, json, parseJsonBody, prependTextStream, textStreamResponse } from "@/server/api/utils";
import { getScript, getScriptVersion, updateScriptVersionPreview } from "@/server/store";

export const handlePreviewChat = async (request: Request) => {
  if (request.method !== "POST") {
    return errorResponse(405, "Method not allowed");
  }

  const body = await parseJsonBody<{
    provider?: string;
    model?: string;
    timeLimitMinutes?: number;
    draft?: unknown;
    messages?: UIMessage[];
  }>(request);

  if (!body?.draft) {
    return errorResponse(400, "draft is required");
  }

  const validation = validateEditorDraft(body.draft);
  if (!validation.ok) {
    return errorResponse(422, "Draft failed validation", validation.errors);
  }

  console.log("[preview] request", {
    provider: body.provider,
    model: body.model,
    messageCount: body.messages?.length ?? 0,
  });

  const runtimeEnv = env as unknown as Record<string, string | undefined>;
  const providerKey = body.provider === "openai"
    ? runtimeEnv.OPENAI_API_KEY
    : body.provider === "openrouter"
      ? runtimeEnv.OPENROUTER_API_KEY
      : runtimeEnv.ANTHROPIC_API_KEY;

  const extractText = (message?: UIMessage) => {
    if (!message) return "";
    if (message.parts && Array.isArray(message.parts)) {
      return message.parts
        .filter((part) => part.type === "text")
        .map((part) => (part.type === "text" ? part.text : ""))
        .join("");
    }
    if ("content" in message && Array.isArray(message.content)) {
      return message.content
        .filter((part: { type: string }) => part.type === "text")
        .map((part: { type: string; text?: string }) => part.text ?? "")
        .join("");
    }
    return "";
  };

  const userMessages = (body.messages ?? []).filter((message) => message.role === "user");
  const nameCandidate = extractText(userMessages[0]);
  const name = nameCandidate.split("\n")[0]?.trim().slice(0, 80) || "there";
  const shouldGreet = userMessages.length === 1 && nameCandidate.trim().length > 0;
  const greetingPrefix = shouldGreet ? `Nice to meet you, ${name}. ` : "";

  const fallbackResponse = () => {
    const questionIndex = Math.min(Math.max(userMessages.length - 1, 0), validation.data.questions.length - 1);
    const question = validation.data.questions[questionIndex];
    const prefix = shouldGreet
      ? greetingPrefix
      : userMessages.length <= 1
        ? "Thanks. "
        : "Got it—thanks. ";
    return `${prefix}${question?.question ?? "Tell me more about that."}`;
  };

  if (isMockAiEnabled() || !providerKey) {
    const stream = new ReadableStream<string>({
      start(controller) {
        controller.enqueue(fallbackResponse());
        controller.close();
      },
    });
    return textStreamResponse(stream);
  }

  const provider = resolveProvider(body.provider);
  const interview = interviewFromEditorDraft(validation.data);
  const system = buildSystemPrompt(interview, defaultPrompt, body.timeLimitMinutes ?? 15);

  try {
    const result = streamText({
      model: getModel(provider, body.model),
      system,
      messages: await convertToModelMessages(body.messages ?? []),
    });

    const stream = shouldGreet ? prependTextStream(greetingPrefix, result.textStream) : result.textStream;
    return textStreamResponse(stream);
  } catch (err) {
    console.error("[preview] model error", err);
    const stream = new ReadableStream<string>({
      start(controller) {
        controller.enqueue(fallbackResponse());
        controller.close();
      },
    });
    return textStreamResponse(stream);
  }
};

export const handlePreviewSave = async (request: Request, scriptId: string, versionId: string) => {
  if (request.method !== "POST") {
    return errorResponse(405, "Method not allowed");
  }

  const script = await getScript(scriptId);
  if (!script) return errorResponse(404, "Script not found");

  const version = await getScriptVersion(versionId);
  if (!version || version.script_id !== scriptId) {
    return errorResponse(404, "Script version not found");
  }

  const body = await parseJsonBody<{ transcript?: UIMessage[] | null }>(request);
  if (!body || !("transcript" in body)) {
    return errorResponse(400, "transcript is required");
  }

  const transcriptJson = body.transcript ? JSON.stringify(body.transcript) : null;
  await updateScriptVersionPreview(versionId, transcriptJson);
  return json({ status: "ok" });
};
