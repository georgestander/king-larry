"use server";

import { SurveyShell } from "@/app/components/builder/SurveyShell";
import { buildSurveySteps } from "@/app/components/builder/steps";
import { SurveyScriptClient } from "@/app/pages/survey-script-client";
import { defaultInterviewTemplate, defaultPrompt } from "@/data/default-script";
import { editorDraftFromInterview } from "@/lib/editor-to-interview";
import { getActiveScriptVersion, getScript, listScriptVersions, listSessionsByScriptId } from "@/server/store";

export const SurveyScriptPage = async ({ params }: { params: { id: string } }) => {
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
    activeStep: "script",
    hasScript: versions.length > 0,
    hasPreview: Boolean(activeVersion?.preview_transcript_json),
    hasRuns: runs.length > 0,
  });

  let initialDraft = editorDraftFromInterview(defaultInterviewTemplate);
  initialDraft.meta.title = script.title;
  initialDraft.promptMarkdown = defaultPrompt.trim();

  if (activeVersion?.editor_json) {
    try {
      initialDraft = JSON.parse(activeVersion.editor_json) as typeof initialDraft;
    } catch {
      initialDraft = initialDraft;
    }
  } else if (activeVersion?.json) {
    try {
      const parsed = JSON.parse(activeVersion.json);
      initialDraft = editorDraftFromInterview(parsed);
    } catch {
      initialDraft = initialDraft;
    }
  }

  initialDraft.promptMarkdown = defaultPrompt.trim();

  return (
    <SurveyShell
      title={script.title}
      subtitle="Script editor"
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
    >
      <SurveyScriptClient
        scriptId={script.id}
        versionId={activeVersion?.id ?? null}
        initialDraft={initialDraft}
      />
    </SurveyShell>
  );
};
