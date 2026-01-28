"use server";

import { getDb } from "@/db/client";
import type { ScriptRow, ScriptVersionRow, SessionRow, ParticipantRow } from "@/db/types";
import { defaultInterview, defaultPrompt } from "@/data/default-script";
import { validateInterviewDefinition } from "@/lib/interview-validators";
import { createInviteToken } from "@/lib/tokens";

const nowIso = () => new Date().toISOString();

const createId = () => crypto.randomUUID();

export const ensureSeedData = async () => {
  const db = getDb();
  const existing = await db.selectFrom("scripts").select(["id"]).limit(1).execute();
  if (existing.length > 0) return;

  const validation = validateInterviewDefinition(defaultInterview);
  if (!validation.ok) {
    throw new Error(`Seed interview invalid: ${validation.errors.join(", ")}`);
  }

  const scriptId = createId();
  const versionId = createId();

  await db
    .insertInto("scripts")
    .values({
      id: scriptId,
      title: defaultInterview.meta.title,
      created_at: nowIso(),
      active_version_id: versionId,
    })
    .execute();

  await db
    .insertInto("script_versions")
    .values({
      id: versionId,
      script_id: scriptId,
      version: 1,
      json: JSON.stringify(defaultInterview, null, 2),
      prompt_markdown: defaultPrompt.trim(),
      status: "active",
      created_at: nowIso(),
      previous_version_id: null,
    })
    .execute();
};

export const listScripts = async () => {
  const db = getDb();
  return db
    .selectFrom("scripts")
    .select(["id", "title", "created_at", "active_version_id"])
    .orderBy("created_at", "desc")
    .execute();
};

export const getScript = async (scriptId: string) => {
  const db = getDb();
  return db.selectFrom("scripts").selectAll().where("id", "=", scriptId).executeTakeFirst() ?? null;
};

export const listScriptVersions = async (scriptId: string) => {
  const db = getDb();
  return db
    .selectFrom("script_versions")
    .selectAll()
    .where("script_id", "=", scriptId)
    .orderBy("version", "desc")
    .execute();
};

export const getScriptVersion = async (versionId: string) => {
  const db = getDb();
  const versions = await db
    .selectFrom("script_versions")
    .selectAll()
    .where("id", "=", versionId)
    .execute();
  return versions[0] ?? null;
};

export const createScript = async (title: string, json: string, promptMarkdown: string) => {
  const db = getDb();
  const scriptId = createId();
  const versionId = createId();

  const parsed = JSON.parse(json) as unknown;
  const validation = validateInterviewDefinition(parsed);
  if (!validation.ok) {
    throw new Error(validation.errors.join("\n"));
  }

  await db
    .insertInto("scripts")
    .values({
      id: scriptId,
      title,
      created_at: nowIso(),
      active_version_id: versionId,
    })
    .execute();

  await db
    .insertInto("script_versions")
    .values({
      id: versionId,
      script_id: scriptId,
      version: 1,
      json,
      prompt_markdown: promptMarkdown,
      status: "active",
      created_at: nowIso(),
      previous_version_id: null,
    })
    .execute();

  return { scriptId, versionId };
};

export const createScriptVersion = async (
  scriptId: string,
  json: string,
  promptMarkdown: string,
  previousVersionId?: string | null,
) => {
  const db = getDb();
  const existingVersions = await db
    .selectFrom("script_versions")
    .select(["version"])
    .where("script_id", "=", scriptId)
    .orderBy("version", "desc")
    .limit(1)
    .execute();

  const nextVersion = (existingVersions[0]?.version ?? 0) + 1;
  const versionId = createId();

  await db
    .insertInto("script_versions")
    .values({
      id: versionId,
      script_id: scriptId,
      version: nextVersion,
      json,
      prompt_markdown: promptMarkdown,
      status: "active",
      created_at: nowIso(),
      previous_version_id: previousVersionId ?? null,
    })
    .execute();

  await db
    .updateTable("scripts")
    .set({ active_version_id: versionId })
    .where("id", "=", scriptId)
    .execute();

  return { versionId, version: nextVersion };
};

export const createSession = async (params: {
  title: string;
  scriptVersionId: string;
  timeLimitMinutes: number;
  provider: SessionRow["provider"];
  model: string;
}) => {
  const db = getDb();
  const sessionId = createId();

  await db
    .insertInto("sessions")
    .values({
      id: sessionId,
      script_version_id: params.scriptVersionId,
      title: params.title,
      time_limit_minutes: params.timeLimitMinutes,
      provider: params.provider,
      model: params.model,
      status: "active",
      created_at: nowIso(),
    })
    .execute();

  return sessionId;
};

export const listSessions = async () => {
  const db = getDb();
  return db
    .selectFrom("sessions")
    .selectAll()
    .orderBy("created_at", "desc")
    .execute();
};

export const getSession = async (sessionId: string) => {
  const db = getDb();
  const rows = await db.selectFrom("sessions").selectAll().where("id", "=", sessionId).execute();
  return rows[0] ?? null;
};

export const createParticipantInvites = async (sessionId: string, emails: string[]) => {
  const db = getDb();
  const invitedAt = nowIso();

  const participants: ParticipantRow[] = emails.map((email) => ({
    id: createId(),
    session_id: sessionId,
    email,
    name: null,
    invite_token: createInviteToken(),
    status: "invited",
    invited_at: invitedAt,
    started_at: null,
    completed_at: null,
  }));

  await db.insertInto("participants").values(participants).execute();
  return participants;
};

export const getParticipantByToken = async (token: string) => {
  const db = getDb();
  const rows = await db
    .selectFrom("participants")
    .selectAll()
    .where("invite_token", "=", token)
    .execute();
  return rows[0] ?? null;
};

export const setParticipantName = async (participantId: string, name: string) => {
  const db = getDb();
  await db
    .updateTable("participants")
    .set({ name })
    .where("id", "=", participantId)
    .execute();
};

export const markParticipantStarted = async (participantId: string) => {
  const db = getDb();
  await db
    .updateTable("participants")
    .set({ status: "started", started_at: nowIso() })
    .where("id", "=", participantId)
    .execute();
};

export const markParticipantCompleted = async (participantId: string, reason: "finished" | "timeout" | "manual") => {
  const db = getDb();
  const completedAt = nowIso();

  await db
    .updateTable("participants")
    .set({ status: "completed", completed_at: completedAt })
    .where("id", "=", participantId)
    .execute();

  await db
    .insertInto("completions")
    .values({
      id: createId(),
      participant_id: participantId,
      reason,
      completed_at: completedAt,
    })
    .execute();
};

export const addMessage = async (participantId: string, turnIndex: number, role: "user" | "assistant" | "system", content: string) => {
  const db = getDb();
  await db
    .insertInto("messages")
    .values({
      id: createId(),
      participant_id: participantId,
      turn_index: turnIndex,
      role,
      content,
      created_at: nowIso(),
    })
    .execute();
};

export const getNextTurnIndex = async (participantId: string) => {
  const db = getDb();
  const row = await db
    .selectFrom("messages")
    .select(({ fn }) => fn.max("turn_index").as("maxIndex"))
    .where("participant_id", "=", participantId)
    .executeTakeFirst();
  const maxIndex = typeof row?.maxIndex === "number" ? row.maxIndex : 0;
  return maxIndex + 1;
};

export const getParticipantTranscript = async (participantId: string) => {
  const db = getDb();
  return db
    .selectFrom("messages")
    .selectAll()
    .where("participant_id", "=", participantId)
    .orderBy("turn_index", "asc")
    .execute();
};

export const getSessionParticipants = async (sessionId: string) => {
  const db = getDb();
  return db
    .selectFrom("participants")
    .selectAll()
    .where("session_id", "=", sessionId)
    .orderBy("invited_at", "asc")
    .execute();
};

export const getSessionSummary = async (sessionId: string) => {
  const db = getDb();
  const session = await getSession(sessionId);
  if (!session) return null;
  const participants = await getSessionParticipants(sessionId);
  return { session, participants };
};

export const archiveScriptVersion = async (versionId: string) => {
  const db = getDb();
  await db.updateTable("script_versions").set({ status: "archived" }).where("id", "=", versionId).execute();
};

export const getActiveScriptVersion = async (scriptId: string) => {
  const db = getDb();
  const script = await db.selectFrom("scripts").selectAll().where("id", "=", scriptId).executeTakeFirst();
  if (!script?.active_version_id) return null;
  return getScriptVersion(script.active_version_id);
};
