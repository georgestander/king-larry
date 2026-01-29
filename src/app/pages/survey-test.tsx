import { buildSurveySteps } from "@/app/components/builder/steps";
import { SurveyTopBar } from "@/app/components/builder/SurveyTopBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { SurveyTestClient } from "@/app/pages/survey-test-client";
import { defaultInterviewTemplate, defaultPrompt } from "@/data/default-script";
import { editorDraftFromInterview } from "@/lib/editor-to-interview";
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
    hasInvites: runs.some((run) => (run.sent_count ?? 0) > 0),
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

  draft.meta.title = script.title;
  draft.promptMarkdown = defaultPrompt.trim();

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
      />

      {!activeVersion ? (
        <Card className="border-ink-200/70 bg-white/95">
          <CardHeader>
            <CardTitle>Save a script first</CardTitle>
            <CardDescription>Testing uses the active script version.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-ink-600">
            Save your script changes, then come back to test.
          </CardContent>
        </Card>
      ) : (
        <SurveyTestClient draft={draft} timeLimitMinutes={15} />
      )}
    </div>
  );
};
