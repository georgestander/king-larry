"use server";

import { buildSurveySteps } from "@/app/components/builder/steps";
import { SurveyTestShellClient } from "@/app/pages/survey-test-shell-client";
import { defaultInterviewTemplate, defaultPrompt } from "@/data/default-script";
import { resolveProvider } from "@/lib/ai";
import { editorDraftFromInterview } from "@/lib/editor-to-interview";
import { getDefaultModel } from "@/lib/models";
import { getActiveScriptVersion, getScript, listScriptVersions, listSessionsByScriptId } from "@/server/store";

export const SurveyTestPage = async ({ params }: { params: { id: string } }) => {
  const [script, versions, runs] = await Promise.all([
    getScript(params.id),
    listScriptVersions(params.id),
    listSessionsByScriptId(params.id),
  ]);

  if (!script) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-semibold text-ink-950">Survey not found</h1>
      </div>
    );
  }

  const activeVersion = await getActiveScriptVersion(script.id);
  const steps = buildSurveySteps({
    surveyId: script.id,
    activeStep: "test",
    hasScript: versions.length > 0,
    hasPreview: Boolean(activeVersion?.preview_transcript_json),
    hasRuns: runs.length > 0,
  });

  let draft = editorDraftFromInterview(defaultInterviewTemplate);
  draft.meta.title = script.title;
  draft.promptMarkdown = defaultPrompt.trim();

  if (activeVersion?.editor_json) {
    try {
      draft = JSON.parse(activeVersion.editor_json) as typeof draft;
    } catch {
      draft = draft;
    }
  } else if (activeVersion?.json) {
    try {
      const parsed = JSON.parse(activeVersion.json);
      draft = editorDraftFromInterview(parsed);
    } catch {
      draft = draft;
    }
  }

  draft.promptMarkdown = defaultPrompt.trim();

  const initialProvider = resolveProvider();
  const initialModel = getDefaultModel(initialProvider);

  return (
    <SurveyTestShellClient
      title={script.title}
      steps={steps}
      versions={versions.map((version) => ({
        id: version.id,
        version: version.version,
        status: version.status,
        created_at: version.created_at,
      }))}
      runs={runs.map((run) => ({
        id: run.id,
        title: run.title,
        status: run.status,
        created_at: run.created_at,
      }))}
      scriptId={script.id}
      versionId={activeVersion?.id ?? null}
      draft={draft}
      initialProvider={initialProvider}
      initialModel={initialModel}
      timeLimitMinutes={15}
    />
  );
};
