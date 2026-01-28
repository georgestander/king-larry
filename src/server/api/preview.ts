"use server";

import { convertToModelMessages, streamText, type UIMessage } from "ai";

import { getModel, resolveProvider } from "@/lib/ai";
import { interviewFromEditorDraft } from "@/lib/editor-to-interview";
import { validateEditorDraft } from "@/lib/editor-validators";
import { buildSystemPrompt } from "@/lib/prompt";
import { errorResponse, json, parseJsonBody, textStreamResponse } from "@/server/api/utils";
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

  const provider = resolveProvider(body.provider);
  const interview = interviewFromEditorDraft(validation.data);
  const system = buildSystemPrompt(interview, validation.data.promptMarkdown, body.timeLimitMinutes ?? 15);

  const result = streamText({
    model: getModel(provider, body.model),
    system,
    messages: await convertToModelMessages(body.messages ?? []),
  });

  return textStreamResponse(result.textStream);
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
