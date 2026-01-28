"use server";

import { SurveyTopBar } from "@/app/components/builder/SurveyTopBar";
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
    hasInvites: runs.some((run) => (run.sent_count ?? 0) > 0),
  });

  const hasRuns = runs.length > 0;
  const hasResponses = runs.some((run) => (run.sent_count ?? 0) > 0 || (run.started_count ?? 0) > 0 || (run.completed_count ?? 0) > 0);
  const latestRun = runs[0] ?? null;

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
    <div className="space-y-6">
      <SurveyTopBar
        surveyId={script.id}
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
          script_version_number: run.script_version_number,
          sent_count: run.sent_count,
          started_count: run.started_count,
          completed_count: run.completed_count,
        }))}
        notice={hasRuns ? {
          tone: "warning",
          title: hasResponses ? "Heads up: this survey already has respondents" : "Heads up: this survey has published runs",
          description: latestRun
            ? `Editing creates a new script version. Existing runs stay on Version ${latestRun.script_version_number}. Publishing a new run will split results.`
            : "Editing creates a new script version. Existing runs won’t change. Publishing a new run will split results.",
          actions: [
            { label: "View results", href: `/surveys/${script.id}/runs`, variant: "outline" },
            { label: "Invite participants", href: `/surveys/${script.id}/invite`, variant: "ghost" },
          ],
        } : undefined}
      />

      <SurveyScriptClient
        scriptId={script.id}
        versionId={activeVersion?.id ?? null}
        initialDraft={initialDraft}
      />
    </div>
  );
};
