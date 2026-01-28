"use server";

import { generateText } from "ai";

import { getModel, resolveProvider } from "@/lib/ai";
import { normalizeGeneratedInterview } from "@/lib/interview-normalize";
import { defaultInterviewTemplate, defaultPrompt } from "@/data/default-script";
import { editorDraftFromInterview, interviewFromEditorDraft } from "@/lib/editor-to-interview";
import { validateEditorDraft } from "@/lib/editor-validators";
import { validateInterviewDefinition } from "@/lib/interview-validators";
import {
  archiveScriptVersion,
  createScript,
  createScriptVersion,
  getActiveScriptVersion,
  getScript,
  getScriptVersion,
  listScripts,
  listScriptVersions,
  updateScriptTitle,
} from "@/server/store";
import { errorResponse, isMockAiEnabled, json, parseJsonBody } from "@/server/api/utils";

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

  if (isMockAiEnabled()) {
    const draft = editorDraftFromInterview(defaultInterviewTemplate);
    draft.meta.title = body.title;
    draft.meta.subtitle = body.audience ? `Audience: ${body.audience}` : draft.meta.subtitle;
    draft.briefingMarkdown = body.goal ? `Goal: ${body.goal}` : draft.briefingMarkdown;
    draft.promptMarkdown = defaultPrompt.trim();
    return json({ draft });
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

  const parseJsonFromText = (text: string) => {
    try {
      return JSON.parse(text) as { script: unknown; promptMarkdown: string };
    } catch {
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start === -1 || end === -1 || end <= start) return null;
      try {
        return JSON.parse(text.slice(start, end + 1)) as { script: unknown; promptMarkdown: string };
      } catch {
        return null;
      }
    }
  };

  const generateOnce = async (promptInput: string) => {
    const { text } = await generateText({
      model,
      prompt: promptInput,
    });
    return { text, parsed: parseJsonFromText(text) };
  };

  let result = await generateOnce(prompt);
  if (!result.parsed) {
    console.error("Script generation parse failed", result.text.slice(0, 500));
    result = await generateOnce(`${prompt}\n\nFix any errors and return ONLY valid JSON.`);
  }

  if (!result.parsed) {
    console.error("Script generation parse failed twice", result.text.slice(0, 500));
    return errorResponse(422, "Failed to parse generated JSON");
  }

  const normalized = normalizeGeneratedInterview(result.parsed.script, {
    title: body.title,
    goal: body.goal,
    audience: body.audience,
  });
  const validation = validateInterviewDefinition(normalized);
  if (!validation.ok) {
    console.error("Script validation failed", validation.errors);
    return errorResponse(422, "Generated script failed validation", validation.errors);
  }

  const promptMarkdown = ensureString(result.parsed.promptMarkdown, defaultPrompt);
  const draft = editorDraftFromInterview(validation.data);
  draft.promptMarkdown = promptMarkdown;
  return json({ draft });
};

const ensureString = (value: unknown, fallback: string) =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;

export const handleScripts = async (request: Request) => {
  if (request.method === "GET") {
    const scripts = await listScripts();
    return json({ scripts });
  }

  if (request.method === "POST") {
    const body = await parseJsonBody<{ title?: string; json?: string; promptMarkdown?: string; draft?: unknown }>(request);
    if (!body) {
      return errorResponse(400, "request body is required");
    }

    if (body.draft) {
      const validation = validateEditorDraft(body.draft);
      if (!validation.ok) {
        return errorResponse(422, "Draft failed validation", validation.errors);
      }
      const title = body.title ?? validation.data.meta.title;
      if (!title) return errorResponse(400, "title is required");
      const promptMarkdown = ensureString(validation.data.promptMarkdown, defaultPrompt);
      const editorDraft = { ...validation.data, promptMarkdown };
      const interview = interviewFromEditorDraft(editorDraft, { version: 1 });
      const jsonValue = JSON.stringify(interview, null, 2);
      const editorJson = JSON.stringify(editorDraft, null, 2);
      const { scriptId, versionId } = await createScript(title, jsonValue, promptMarkdown, editorJson);
      return json({ scriptId, versionId });
    }

    if (!body.title || !body.json) {
      return errorResponse(400, "title and json are required");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(body.json);
    } catch (error) {
      return errorResponse(422, "Invalid JSON");
    }

    const validation = validateInterviewDefinition(parsed);
    if (!validation.ok) {
      return errorResponse(422, "Script failed validation", validation.errors);
    }

    const promptMarkdown = ensureString(body.promptMarkdown, defaultPrompt);
    const editorDraft = editorDraftFromInterview(validation.data);
    editorDraft.promptMarkdown = promptMarkdown;
    const editorJson = JSON.stringify(editorDraft, null, 2);

    const { scriptId, versionId } = await createScript(body.title, body.json, promptMarkdown, editorJson);
    return json({ scriptId, versionId });
  }

  return errorResponse(405, "Method not allowed");
};

export const handleScriptVersions = async (request: Request, scriptId: string) => {
  if (request.method === "GET") {
    const versions = await listScriptVersions(scriptId);
    return json({ versions });
  }

  if (request.method === "POST") {
    const script = await getScript(scriptId);
    if (!script) return errorResponse(404, "Script not found");

    const active = await getActiveScriptVersion(scriptId);
    if (active?.id) {
      await archiveScriptVersion(active.id);
    }

    const body = await parseJsonBody<{ json?: string; promptMarkdown?: string; draft?: unknown }>(request);
    if (!body) {
      return errorResponse(400, "request body is required");
    }

    if (body.draft) {
      const validation = validateEditorDraft(body.draft);
      if (!validation.ok) {
        return errorResponse(422, "Draft failed validation", validation.errors);
      }
      if (validation.data.meta.title !== script.title) {
        await updateScriptTitle(scriptId, validation.data.meta.title);
      }
      const promptMarkdown = ensureString(active?.prompt_markdown, defaultPrompt);
      const editorDraft = { ...validation.data, promptMarkdown };
      const interview = interviewFromEditorDraft(editorDraft, { version: (active?.version ?? 0) + 1 });
      const jsonValue = JSON.stringify(interview, null, 2);
      const editorJson = JSON.stringify(editorDraft, null, 2);
      const next = await createScriptVersion(
        scriptId,
        jsonValue,
        promptMarkdown,
        active?.id ?? null,
        editorJson,
        null,
        null,
      );
      return json({ versionId: next.versionId, version: next.version });
    }

    if (!body.json) {
      return errorResponse(400, "json is required");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(body.json);
    } catch (error) {
      return errorResponse(422, "Invalid JSON");
    }

    const validation = validateInterviewDefinition(parsed);
    if (!validation.ok) {
      return errorResponse(422, "Script failed validation", validation.errors);
    }

    const promptMarkdown = ensureString(body.promptMarkdown, defaultPrompt);
    const editorDraft = editorDraftFromInterview(validation.data);
    editorDraft.promptMarkdown = promptMarkdown;
    if (editorDraft.meta.title !== script.title) {
      await updateScriptTitle(scriptId, editorDraft.meta.title);
    }
    const editorJson = JSON.stringify(editorDraft, null, 2);

    const next = await createScriptVersion(
      scriptId,
      body.json,
      promptMarkdown,
      active?.id ?? null,
      editorJson,
      null,
      null,
    );

    return json({ versionId: next.versionId, version: next.version });
  }

  return errorResponse(405, "Method not allowed");
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

  const active = await getActiveScriptVersion(scriptId);
  if (active?.id) {
    await archiveScriptVersion(active.id);
  }

  const next = await createScriptVersion(
    scriptId,
    version.json,
    version.prompt_markdown,
    body.versionId,
    version.editor_json,
    version.preview_transcript_json,
    version.preview_updated_at,
  );

  return json({ versionId: next.versionId, version: next.version });
};
