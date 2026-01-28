"use server";

import {
  createAnonymousInvites,
  createParticipantInvites,
  createSession,
  getParticipantTranscript,
  getSession,
  getSessionParticipants,
  listSessions,
} from "@/server/store";
import { errorResponse, json, parseJsonBody } from "@/server/api/utils";

export const handleSessions = async (request: Request) => {
  if (request.method === "GET") {
    const sessions = await listSessions();
    return json({ sessions });
  }

  if (request.method === "POST") {
    const body = await parseJsonBody<{
      title: string;
      scriptVersionId: string;
      timeLimitMinutes: number;
      provider: "openai" | "anthropic" | "openrouter";
      model: string;
    }>(request);

    if (!body?.title || !body?.scriptVersionId) {
      return errorResponse(400, "title and scriptVersionId are required");
    }

    const sessionId = await createSession({
      title: body.title,
      scriptVersionId: body.scriptVersionId,
      timeLimitMinutes: body.timeLimitMinutes ?? 15,
      provider: body.provider ?? "anthropic",
      model: body.model ?? "claude-sonnet-4-20250514",
    });

    return json({ sessionId });
  }

  return errorResponse(405, "Method not allowed");
};

export const handleSessionDetail = async (request: Request, sessionId: string) => {
  if (request.method !== "GET") {
    return errorResponse(405, "Method not allowed");
  }
  const session = await getSession(sessionId);
  if (!session) return errorResponse(404, "Session not found");
  const participants = await getSessionParticipants(sessionId);
  return json({ session, participants });
};

export const handleSessionInvite = async (request: Request, sessionId: string) => {
  if (request.method !== "POST") {
    return errorResponse(405, "Method not allowed");
  }
  const body = await parseJsonBody<{ emails: string[] }>(request);
  if (!body?.emails?.length) {
    return errorResponse(400, "emails are required");
  }

  const participants = await createParticipantInvites(sessionId, body.emails);
  return json({ participants });
};

export const handleSessionInviteAnonymous = async (request: Request, sessionId: string) => {
  if (request.method !== "POST") {
    return errorResponse(405, "Method not allowed");
  }
  const body = await parseJsonBody<{ count: number }>(request);
  const count = Number(body?.count ?? 0);
  if (!count || count < 1 || count > 500) {
    return errorResponse(400, "count must be between 1 and 500");
  }
  const participants = await createAnonymousInvites(sessionId, count);
  return json({ participants });
};

export const handleParticipantTranscript = async (request: Request, participantId: string) => {
  if (request.method !== "GET") {
    return errorResponse(405, "Method not allowed");
  }
  const transcript = await getParticipantTranscript(participantId);
  return json({ transcript });
};
