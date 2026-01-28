"use server";

import { convertToModelMessages, streamText, type UIMessage } from "ai";

import { getModel } from "@/lib/ai";
import { buildSystemPrompt } from "@/lib/prompt";
import { validateInterviewDefinition } from "@/lib/interview-validators";
import { isTimeExceeded } from "@/lib/time";
import {
  addMessage,
  getNextTurnIndex,
  getParticipantByToken,
  getScriptVersion,
  getSession,
  markParticipantCompleted,
  markParticipantStarted,
} from "@/server/store";
import { errorResponse, json, parseJsonBody, textStreamResponse } from "@/server/api/utils";

const extractMessageText = (message: UIMessage | undefined) => {
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

const readStreamToString = async (stream: ReadableStream<string>) => {
  const reader = stream.getReader();
  let result = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += value;
  }
  return result;
};

export const handleInterviewMessage = async (request: Request, token: string) => {
  const body = await parseJsonBody<{ messages: UIMessage[] }>(request);
  const messages = body?.messages ?? [];

  const participant = await getParticipantByToken(token);
  if (!participant) return errorResponse(403, "Invalid invite token");
  if (participant.status === "completed") {
    return errorResponse(410, "Interview already completed");
  }

  const session = await getSession(participant.session_id);
  if (!session) return errorResponse(404, "Session not found");

  const version = await getScriptVersion(session.script_version_id);
  if (!version) return errorResponse(404, "Script version not found");

  const parsed = JSON.parse(version.json) as unknown;
  const validation = validateInterviewDefinition(parsed);
  if (!validation.ok) {
    return errorResponse(422, "Stored script failed validation", validation.errors);
  }

  const now = Date.now();
  const startedAt = participant.started_at ? Date.parse(participant.started_at) : now;
  if (!participant.started_at) {
    await markParticipantStarted(participant.id);
  }

  if (isTimeExceeded(startedAt, session.time_limit_minutes, now)) {
    await markParticipantCompleted(participant.id, "timeout");
    const closing = new ReadableStream<string>({
      start(controller) {
        controller.enqueue("Thanks for your time — we’ve reached the interview limit. Your responses are saved.");
        controller.close();
      },
    });
    return textStreamResponse(closing);
  }

  const lastMessage = messages[messages.length - 1];
  const userText = extractMessageText(lastMessage);
  if (userText) {
    const userTurn = await getNextTurnIndex(participant.id);
    await addMessage(participant.id, userTurn, "user", userText);
  }

  const system = buildSystemPrompt(validation.data, version.prompt_markdown, session.time_limit_minutes);

  const result = streamText({
    model: getModel(session.provider, session.model),
    system,
    messages: await convertToModelMessages(messages),
  });

  const [stream, captureStream] = result.textStream.tee();
  void readStreamToString(captureStream).then(async (assistantText) => {
    if (!assistantText) return;
    const assistantTurn = await getNextTurnIndex(participant.id);
    await addMessage(participant.id, assistantTurn, "assistant", assistantText);
  });

  return textStreamResponse(stream);
};

export const handleInterviewComplete = async (request: Request, token: string) => {
  if (request.method !== "POST") return errorResponse(405, "Method not allowed");
  const participant = await getParticipantByToken(token);
  if (!participant) return errorResponse(403, "Invalid invite token");
  if (participant.status === "completed") {
    return json({ status: "completed" });
  }
  await markParticipantCompleted(participant.id, "manual");
  return json({ status: "completed" });
};
