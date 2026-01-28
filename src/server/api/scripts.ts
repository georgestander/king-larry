"use server";

import { generateText } from "ai";

import { getModel, resolveProvider } from "@/lib/ai";
import { validateInterviewDefinition } from "@/lib/interview-validators";
import { createScript, createScriptVersion, getScriptVersion, listScripts, listScriptVersions } from "@/server/store";
import { errorResponse, json, parseJsonBody } from "@/server/api/utils";

type GenerateBody = {
  title: string;
  goal: string;
  audience?: string;
  notes?: string;
  provider?: string;
  model?: string;
};

export const handleScriptsGenerate = async (request: Request) => {
  const body = await parseJsonBody<GenerateBody>(request);
  if (!body?.title || !body?.goal) {
    return errorResponse(400, "title and goal are required");
  }

  const provider = resolveProvider(body.provider);
  const model = getModel(provider, body.model);

  const prompt = `You are a research interviewer. Generate a JSON object with two keys:
1) "script": an interview definition JSON with { meta, context, questions }.
2) "promptMarkdown": a narrative system prompt in Markdown.

Rules:
- The interview JSON must include meta.id, meta.version, meta.title, meta.subtitle, and at least 5 questions.
- Questions must be concise and narrative-driven.
- The prompt should enforce one question at a time and a warm, human tone.

Title: ${body.title}
Goal: ${body.goal}
Audience: ${body.audience ?? "General"}
Notes: ${body.notes ?? "N/A"}

Return ONLY valid JSON.`;

  const { text } = await generateText({
    model,
    prompt,
  });

  let parsed: { script: unknown; promptMarkdown: string };
  try {
    parsed = JSON.parse(text) as { script: unknown; promptMarkdown: string };
  } catch (error) {
    return errorResponse(422, "Failed to parse generated JSON", { raw: text });
  }

  const validation = validateInterviewDefinition(parsed.script);
  if (!validation.ok) {
    return errorResponse(422, "Generated script failed validation", validation.errors);
  }

  return json({ script: validation.data, promptMarkdown: parsed.promptMarkdown ?? "" });
};

export const handleScripts = async (request: Request) => {
  if (request.method === "GET") {
    const scripts = await listScripts();
    return json({ scripts });
  }

  if (request.method === "POST") {
    const body = await parseJsonBody<{ title: string; json: string; promptMarkdown: string }>(request);
    if (!body?.title || !body?.json) {
      return errorResponse(400, "title and json are required");
    }
    const { scriptId, versionId } = await createScript(body.title, body.json, body.promptMarkdown ?? "");
    return json({ scriptId, versionId });
  }

  return errorResponse(405, "Method not allowed");
};

export const handleScriptVersions = async (request: Request, scriptId: string) => {
  if (request.method !== "GET") {
    return errorResponse(405, "Method not allowed");
  }
  const versions = await listScriptVersions(scriptId);
  return json({ versions });
};

export const handleScriptRollback = async (request: Request, scriptId: string) => {
  if (request.method !== "POST") {
    return errorResponse(405, "Method not allowed");
  }
  const body = await parseJsonBody<{ versionId: string }>(request);
  if (!body?.versionId) {
    return errorResponse(400, "versionId is required");
  }
  const version = await getScriptVersion(body.versionId);
  if (!version || version.script_id !== scriptId) {
    return errorResponse(404, "Script version not found");
  }

  const next = await createScriptVersion(
    scriptId,
    version.json,
    version.prompt_markdown,
    body.versionId,
  );

  return json({ versionId: next.versionId, version: next.version });
};
